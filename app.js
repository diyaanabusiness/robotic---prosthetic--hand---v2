import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const video = document.querySelector("#camera");
const canvas = document.querySelector("#preview");
const context = canvas.getContext("2d");
const cameraButton = document.querySelector("#camera-button");
const cameraStatus = document.querySelector("#camera-status");
const trackingHint = document.querySelector("#tracking-hint");
const previewMessage = document.querySelector("#preview-message");
const openCount = document.querySelector("#open-count");
const fingerRows = new Map(
  [...document.querySelectorAll(".finger-row")].map((row) => [row.dataset.finger, row.querySelector(".state-pill")]),
);

const connections = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

let handLandmarker;
let cameraStream;
let animationFrame;
let lastInference = 0;
let isRunning = false;

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y, (first.z ?? 0) - (second.z ?? 0));
}

function classifyFingers(landmarks) {
  const wrist = landmarks[0];
  const isExtended = (tip, joint) => distance(wrist, landmarks[tip]) > distance(wrist, landmarks[joint]) * 1.12;
  const thumbIsExtended = distance(landmarks[4], landmarks[5]) > distance(landmarks[3], landmarks[5]) * 1.1;

  return {
    thumb: thumbIsExtended,
    index: isExtended(8, 6),
    middle: isExtended(12, 10),
    ring: isExtended(16, 14),
    pinky: isExtended(20, 18),
  };
}

function updateReadout(states) {
  let count = 0;
  for (const [name, isOpen] of Object.entries(states)) {
    const pill = fingerRows.get(name);
    pill.textContent = isOpen ? "OPEN" : "CLOSED";
    pill.className = `state-pill ${isOpen ? "open" : "closed"}`;
    if (isOpen) count += 1;
  }
  openCount.textContent = String(count);
  trackingHint.textContent = `${count} OF 5 FINGERS OPEN`;
}

function setWaitingState() {
  for (const pill of fingerRows.values()) {
    pill.textContent = "WAITING";
    pill.className = "state-pill unknown";
  }
  openCount.textContent = "–";
}

function drawLandmarks(landmarks) {
  context.lineWidth = Math.max(2, canvas.width / 480);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#c8f169";
  context.fillStyle = "#f4ffd8";

  for (const [start, end] of connections) {
    context.beginPath();
    context.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
    context.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
    context.stroke();
  }
  for (const landmark of landmarks) {
    context.beginPath();
    context.arc(landmark.x * canvas.width, landmark.y * canvas.height, Math.max(2, canvas.width / 180), 0, Math.PI * 2);
    context.fill();
  }
}

function renderFrame(timestamp) {
  if (!isRunning) return;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (timestamp - lastInference > 33) {
      lastInference = timestamp;
      const result = handLandmarker.detectForVideo(video, timestamp);
      if (result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        drawLandmarks(landmarks);
        updateReadout(classifyFingers(landmarks));
        trackingHint.textContent = "HAND DETECTED · MOVE TO UPDATE";
      } else {
        setWaitingState();
        trackingHint.textContent = "Show one hand to the camera";
      }
    }
    context.restore();
  }
  animationFrame = requestAnimationFrame(renderFrame);
}

async function createLandmarker() {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
}

async function startCamera() {
  cameraButton.disabled = true;
  cameraButton.querySelector("span:last-child").textContent = "Starting...";
  trackingHint.textContent = "Loading hand tracker...";

  try {
    if (!handLandmarker) handLandmarker = await createLandmarker();
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 800 } },
    });
    video.srcObject = cameraStream;
    await video.play();
    isRunning = true;
    previewMessage.classList.add("hidden");
    cameraStatus.textContent = "TRACKING";
    cameraStatus.classList.add("active");
    cameraButton.querySelector("span:last-child").textContent = "Stop camera";
    cameraButton.querySelector(".button-icon").textContent = "■";
    trackingHint.textContent = "Show one hand to the camera";
    animationFrame = requestAnimationFrame(renderFrame);
  } catch (error) {
    stopCamera();
    const message = error.name === "NotAllowedError"
      ? "Camera access was blocked. Allow access in your browser settings."
      : error.name === "NotFoundError"
        ? "No camera was found on this device."
        : "Could not start the camera. Check your connection and camera permissions.";
    trackingHint.textContent = message;
  } finally {
    cameraButton.disabled = false;
  }
}

function stopCamera() {
  isRunning = false;
  cancelAnimationFrame(animationFrame);
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = undefined;
  video.srcObject = null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  previewMessage.classList.remove("hidden");
  cameraStatus.textContent = "NOT CONNECTED";
  cameraStatus.classList.remove("active");
  cameraButton.querySelector("span:last-child").textContent = "Start camera";
  cameraButton.querySelector(".button-icon").textContent = "◉";
  trackingHint.textContent = "Allow camera access to begin";
  setWaitingState();
}

cameraButton.addEventListener("click", () => {
  if (isRunning) stopCamera();
  else startCamera();
});

window.addEventListener("beforeunload", () => {
  cameraStream?.getTracks().forEach((track) => track.stop());
  handLandmarker?.close();
});