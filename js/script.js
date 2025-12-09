const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const context = canvas.getContext("2d");

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  } catch (error) {
    console.error("Error accessing webcam:", error);
  }
}

async function loadModels() {
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  console.log("Models loaded");
}

function drawLandmarks(landmarks) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "lime";
  context.lineWidth = 2;

  const drawPath = (points, closePath = false) => {
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    if (closePath) {
      context.closePath();
    }
    context.stroke();
  };

  // Jaw
  drawPath(landmarks.getJawOutline());
  // Left eyebrow
  drawPath(landmarks.getLeftEyeBrow());
  // Right eyebrow
  drawPath(landmarks.getRightEyeBrow());
  // Nose
  drawPath(landmarks.getNose());
  // Left eye
  drawPath(landmarks.getLeftEye(), true);
  // Right eye
  drawPath(landmarks.getRightEye(), true);
  // Mouth
  drawPath(landmarks.getMouth(), true);
}

async function onPlay() {
  if (video.paused || video.ended) return setTimeout(() => onPlay());

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  });
  const result = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks(true);

  if (result) {
    const dims = faceapi.matchDimensions(canvas, video, true);
    const resizedResult = faceapi.resizeResults(result, dims);
    drawLandmarks(resizedResult.landmarks);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(onPlay);
}

async function main() {
  await loadModels();
  await setupCamera();
  video.play();
  onPlay();
}

main();
