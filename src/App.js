import "./App.css";
import { Hands } from '@mediapipe/hands';
import * as hands from '@mediapipe/hands'
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
import React, { useRef, useEffect } from "react";

function App() {

  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const wbRef = useRef(null);
  const connect = window.drawConnectors;
  const connectlm = window.drawLandmarks;
  const colorsRef = useRef(null);

  useEffect(() => {

    var camera = null;
    const wb = wbRef.current;
    const ctx = wb.getContext("2d");
    const colors = document.getElementsByClassName('color')
    const current = {
      color: 'black'
    }
    let dataURL = ''
    let drawing = false

    const drawLine = (x0, y0, x1, y1, color, send) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      if (color === 'white') {
        ctx.lineWidth = 12;
      }
      else {
        ctx.lineWidth = 2;
      }
      ctx.stroke();
      ctx.closePath();
      ctx.save();
    }

    let rect = wb.getBoundingClientRect();
    let scaleX = wb.width / rect.width;
    let scaleY = wb.height / rect.height;
    /*
    console.log(rect)
    console.log(scaleX)
    console.log(scaleY)
    */



    const onMouseDown = (e) => {
      drawing = true
      current.x = e.clientX || e.touches[0].clientX;
      current.y = e.clientY || e.touches[0].clientY;
    }

    const onMouseMove = (e) => {
      if (!drawing) return;
      drawLine((current.x - rect.left) * scaleX, (current.y - rect.top) * scaleY, (e.clientX - rect.left) * scaleX || (e.touches[0].clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY || (e.touches[0].clientY - rect.top) * scaleY, current.color, true)
      current.x = e.clientX || e.touches[0].clientX;
      current.y = e.clientY || e.touches[0].clientY;
    }
    const onMouseUp = (e) => {
      if (!drawing) return;

      drawing = false;
      //drawLine((current.x - rect.left) * scaleX, (current.y - rect.top) * scaleY, (e.clientX - rect.left) * scaleX || (e.touches[0].clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY || (e.touches[0].clientY - rect.top) * scaleY, current.color, true)
    }

    const throttle = (callback, delay) => {
      let previousCall = new Date().getTime()
      return function () {
        const time = new Date().getTime()
        if ((time - previousCall) >= delay) {
          previousCall = time
          callback.apply(null, arguments)
        }
      }
    }


    const onColorUpdate = (e) => {
      current.color = e.target.className.split(' ')[1]
    }

    const event = new CustomEvent("drawfing", { detail: { x: "x" } })
    wb.dispatchEvent(event)

    wb.addEventListener('mousedown', onMouseDown, false);
    wb.addEventListener('mouseup', onMouseUp, false);
    wb.addEventListener('mouseout', onMouseUp, false);
    wb.addEventListener('mousemove', throttle(onMouseMove, 10), false);



    wb.addEventListener('touchstart', onMouseDown, false);
    wb.addEventListener('touchend', onMouseUp, false);
    wb.addEventListener('touchcancel', onMouseUp, false);
    wb.addEventListener('touchmove', throttle(onMouseMove, 10), false);
    //wb.addEventListener('drawfing', e => { console.log(e.detail)})
    for (let i = 0; i < colors.length; i++) {
      colors[i].addEventListener('click', onColorUpdate, false)
    }

    const onResize = () => {
      wb.width = 480;
      wb.height = 640;
      let img = document.createElement('img')
      img.src = dataURL;
      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }

    //window.addEventListener('resize', onResize, false)
    onResize()

    const handpose = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    })

    function onResults(results) {

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image, 0, 0,
        canvasElement.width,
        canvasElement.height
      );
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          connect(canvasCtx, landmarks, hands.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 5 });
          connectlm(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
        }

        const tipid = [4, 8, 12, 16, 20]
        const fingup = [0, 0, 0, 0, 0]
        if (results.multiHandLandmarks.length !== 0) {
          const temp = results.multiHandLandmarks[0];
          var x1 = temp[8].x;
          var y1 = temp[8].y;

          if (temp[tipid[0]].x > temp[tipid[0] - 1].x) {
            fingup[0] = 1;
          }

          for (let i = 1; i < 5; i++) {
            if (temp[tipid[i]].y < temp[tipid[i] - 2].y) {
              fingup[i] = 1;
            }
          }

          if (fingup[1] === 1 && fingup[2] === 1) {
            console.log("selection mode")
            current.x = (x1 * 1000);
            current.y = (y1 * 1000);
          }

          //const event = new Event('draw');
          if (fingup[1] === 1 && fingup[2] === 0) {
            console.log("Drawing mode")
            drawLine(((current.x)), ((current.y)), (((x1 * 1000))), (((y1 * 1000))), current.color, true)
            current.x = (x1 * 1000);
            current.y = (y1 * 1000);


          }
        }
      }
    }

    handpose.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await handpose.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
        flip_horiz: true

      });
      camera.start();
    }
    handpose.onResults(onResults);
  });

  return (
    <div className="App">
      <header className="App-header">
        <div id="container">
          <Webcam hidden
            ref={webcamRef}
            style={{
              width: 640,
              height: 480,
              position: "fixed",
            }}
          />
          <canvas className="vid"
            ref={canvasRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 650,
              right: 0,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
              transform: "scaleX(-1)"

            }}
          />
          <div></div>
          <canvas className="whiteboard"
            ref={wbRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 650,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
              backgroundColor: "White",
              transform: "scaleX(-1)"
            }}
          />
          <div ref={colorsRef} className="colors" id="overlay">
            <div className="color black" />
            <div className="color red" />
            <div className="color green" />
            <div className="color blue" />
            <div className="color yellow" />
            <div className="color white" />
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;