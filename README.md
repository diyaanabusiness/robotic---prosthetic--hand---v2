# Diyaana Hand Tracker

Diyaana is a small browser application that uses Google MediaPipe Hand Landmarker to recognize whether each of the five fingers on one hand is open or closed. It shows a live camera preview with hand landmarks and updates the state of the thumb, index, middle, ring, and pinky.

## Features

- Detects one hand and displays its landmark connections over the camera preview.
- Shows each finger as `OPEN` or `CLOSED` and counts the open fingers.
- Processes camera frames in the browser; it does not upload the video to an application server.
- Runs as a static website without Node.js, a package manager, or a build step.

## Requirements

- A computer with a webcam.
- A current version of Chrome or Microsoft Edge recommended.
- An internet connection so the browser can download MediaPipe, its hand model, and the web fonts.
- Python 3 for the simple local server instructions below, or the VS Code Live Server extension.

Camera access requires a secure browser context. `http://localhost` is allowed for local development; opening `index.html` directly as a `file://` URL may prevent camera access.

## Download the project

Open Terminal on macOS/Linux or PowerShell on Windows, then run:

```sh
git clone https://github.com/diyaanabusiness/robotic---prosthetic--hand---v2.git
cd robotic---prosthetic--hand---v2
```

Alternatively, on the GitHub repository page choose **Code > Download ZIP**, extract the downloaded folder, and open a terminal in that folder.

## Run locally

### Option 1: Python local server

Python is used only to serve the static files; the application itself does not require Python packages.

macOS/Linux:

```sh
python3 --version
python3 -m http.server 8000
```

Windows PowerShell:

```powershell
py --version
py -m http.server 8000
```

Leave the server running and open [http://localhost:8000](http://localhost:8000) in your browser. To stop the server, return to the terminal and press `Ctrl+C`.

If port `8000` is already in use, choose another port in the server command, such as `8001`, and open `http://localhost:8001` instead.

### Option 2: VS Code Live Server

1. Open the project folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and select **Open with Live Server**.
4. Open the local URL shown by VS Code.

## Use the tracker

1. Select **Start camera**.
2. Allow the browser to use the webcam.
3. Hold one hand where it is visible to the camera. The preview is mirrored like a selfie view.
4. Read the live `OPEN` or `CLOSED` status beside each finger. The counter shows how many fingers are open.
5. Select **Stop camera** when finished. The camera also stops when the page is closed.

## How recognition works

MediaPipe Hand Landmarker locates 21 landmarks for the detected hand. Diyaana compares landmark distances to estimate each finger's state: the thumb uses distances around its tip and base, while the other fingers compare their tips and joints relative to the wrist. The app runs the landmark detector in video mode and draws the resulting landmarks on a canvas.

These are simple geometric heuristics, not a medical or measurement tool. Results can vary with hand orientation, camera angle, lighting, and how clearly the hand is visible. The current app tracks one hand at a time.

## Privacy and network use

Camera frames are read and processed by the browser and are not sent to a Diyaana server. The browser does need internet access to retrieve the MediaPipe JavaScript bundle and WASM files from jsDelivr, the hand model from Google Cloud Storage, and fonts from Google Fonts. No camera permission is needed until **Start camera** is selected.

## Troubleshooting

- **The camera prompt does not appear:** Make sure the app is opened at a `localhost` URL, then check the browser's site permissions for camera access.
- **Camera access was blocked:** Change the site camera permission to **Allow**, reload the page, and select **Start camera** again.
- **No camera was found:** Connect or enable a webcam, close any application currently using it, and reload the page.
- **The tracker does not load:** Check the internet connection and reload. The MediaPipe bundle, WASM runtime, and model are downloaded from external services.
- **No hand is detected:** Show one hand fully in the preview, improve lighting, and keep it within the camera frame.
- **The page was opened directly from a file:** Start one of the local servers above and use its `http://localhost` address.

## Project files

- `index.html` - page structure and controls.
- `style.css` - responsive layout and visual styling.
- `app.js` - camera handling, MediaPipe setup, landmark drawing, and finger-state logic.
- `README.md` - setup and usage instructions.