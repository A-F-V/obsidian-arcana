/*
A voice record button that uses OpenAI's Whispher model
*/
import React, { useState, useEffect, useRef } from 'react';

class Recorder {
  gumStream: MediaStream | null; //stream from getUserMedia()
  recorder: MediaRecorder | null; //MediaRecorder object
  chunks: BlobPart[] = []; //Array of chunks of audio data from the browser
  extension: string | null;
  onFinish: (blob: Blob) => void;

  constructor(onFinish: (blob: Blob) => void) {
    this.gumStream = null;
    this.recorder = null;
    this.chunks = [];
    this.extension = null;
    this.onFinish = onFinish;
  }

  async beginRecording() {
    //URL = window.URL || window.webkitURL;

    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      this.extension = 'webm';
    } else {
      // TODO:
      // Raise a warning
    }

    const constraints = { audio: true, video: false };

    /*
				  We're using the standard promise based getUserMedia()
				  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
			  */

    const callback = ((stream: MediaStream) => {
      console.log(
        'getUserMedia() success, stream created, initializing MediaRecorder'
      );
      console.log(this);

      /*  assign to gumStream for later use  */
      this.gumStream = stream;

      const options = {
        audioBitsPerSecond: 256000,
        videoBitsPerSecond: 2500000,
        bitsPerSecond: 2628000,
        mimeType: 'audio/' + this.extension + ';codecs=opus',
      };

      //update the format
      // document.getElementById("formats").innerHTML =
      //   "Sample rate: 48kHz, MIME: audio/" + extension + ";codecs=opus";

      /*
					  Create the MediaRecorder object
				  */
      this.recorder = new MediaRecorder(stream, options);
      console.log('recorder is now a MediaRecorder object');

      //when data becomes available add it to our array of audio data
      this.recorder.ondataavailable = (e: BlobEvent) => {
        // console.log("recorder.bitsPerSecond:" + recorder.bitsPerSecond);
        // add stream data to chunks
        this.chunks.push(e.data);
      };
      this.recorder.onstop = ((e: Event) => {
        console.log('recorder.onstop'); // convert stream data chunks to a 'webm' audio format as a blob
        const blob = new Blob(this.chunks, {
          type: 'audio/' + this.extension,
        });
        console.log(blob.type);
        this.onFinish(blob);
      }).bind(this);
      this.recorder.onerror = console.log;

      //start recording using 1 second chunks
      //Chrome and Firefox will record one long chunk if you do not specify the chunck length
      this.recorder.start(1000);

      //recorder.start();
      //   recorder = null;
      //   blob = null;
      this.chunks = [];
    }).bind(this);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(callback)
      .catch(function (err) {
        //enable the record button if getUserMedia() fails
        console.log(err);
        console.log(
          'getUserMedia() failed. Please check your browser settings.'
        );
      });
  }
  async stopRecording() {
    console.log(this.recorder);
    this.recorder?.stop();
    this.gumStream //stop microphone access
      ?.getAudioTracks()[0]
      .stop();
  }
}

export default function WhisperButton({
  onRecordingEnd,
}: {
  onRecordingEnd: (blob: Blob) => void;
}) {
  // A stylish button that goes red when pressed
  const [recording, setRecording] = useState(false);
  // Use a ref to keep a consistent reference to the recorder across renders
  const recorderRef = useRef(new Recorder(onRecordingEnd));

  const beginRecording = () => {
    recorderRef.current.beginRecording();
  };

  const endRecording = () => {
    recorderRef.current.stopRecording();
  };

  useEffect(() => {
    if (recording) {
      beginRecording();
    } else {
      endRecording();
    }
  }, [recording]);

  return (
    <div>
      <button
        onClick={() => setRecording(!recording)}
        style={{
          backgroundColor: recording ? 'red' : 'blue',
          color: 'white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          fontWeight: 'bold',
          border: 'none',
        }}
      >
        {recording ? '🎙️' : '🎤'}
      </button>
    </div>
  );
}
