import React, { useState, useEffect, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { PresentationControls } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { uploadBytes, uploadBytesResumable } from "firebase/storage";

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: "gs://meta-grave.appspot.com",
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const Three = () => {
  // gltfデータ(URLではなく読み込み後のオブジェクトを格納するための配列)
  const [gltf, setGltf] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const listRef = ref(storage, "gs://meta-grave.appspot.com/image/");
  useEffect(() => {
    // const manager = new THREE.LoadingManager();
    let isMounted = true;
    const promises = [];
    listAll(listRef)
      .then((res) => {
        res.items.forEach((itemRef) => {
          promises.push(getDownloadURL(itemRef));
        });
        return Promise.all(promises);
      })
      .then((results) => {
        results.forEach(function (element) {
          const loader = new GLTFLoader();
          loader.load(element, (gltf) => {
            if (isMounted) {
              // useStateの配列にset関数を使うと全部更新されちゃうのでこうする
              setGltf((prevItems) => [...prevItems, gltf]);
              setIsLoading(false);
            }
          });
        });
      })
      .then(() => {
        setIsLoading(false);
      })
      .then(() => {
        console.log(gltf);
      })
      .catch((error) => {
        console.log(error);
      });

    return () => {
      isMounted = false;
    };
  }, []);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {gltf.map((models, index) => (
        <div key={index} className="wrapper" style={{ margin: "10px" }}>
          <div class="window" style={{ width: "30vh" }}>
            <div class="title-bar">
              <div class="title-bar-text"></div>
              <div class="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div class="window-body" style={{ height: "30vh" }}>
              {/* PLACE TO RENDER!! */}

              <div className="wrapper">
                <Canvas
                  style={{
                    width: "90%",
                    height: "100%",
                    margin: "0 auto",
                  }}
                  flat
                  dpr={[1, 2]}
                  camera={{ fov: 50, position: [0, 0, 4] }}
                  // 要ポジション調整

                  shadows={true}
                >
                  <directionalLight position={[3.3, 1.0, 4.4]} castShadow />

                  {/* <color attach="background" args={["white"]} /> */}
                  <PresentationControls
                    global
                    zoom={1.6}
                    rotation={[0, -Math.PI / 4, 0]}
                    polar={[0, Math.PI / 4]}
                    azimuth={[-Math.PI / 4, Math.PI / 4]}
                  >
                    <Rotate position-y={-0.5} scale={1}>
                      <Suspense fallbacl={null}>
                        <primitive object={models.scene} />
                      </Suspense>
                    </Rotate>
                  </PresentationControls>
                </Canvas>
              </div>

              {/* PLACE TO RENDER!! */}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const ImageUploader = () => {
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const OnFileUploadtoFirebase = (e) => {
    let fileInput = document.getElementById("glbInput");
    e.preventDefault();
    const file = fileInput.files[0];
    // 形式は後で絞る
    if (file.size < 73400320) {
      const fileName = new Date().getTime() + "-" + file.name;
      const storageRef = ref(storage, "image/" + fileName);

      const uploadImage = uploadBytesResumable(storageRef, file);
      uploadImage.on(
        "state_changed",
        (snapshot) => {
          setLoading(true);
        },

        (err) => {
          console.log(err);
        },
        () => {
          setLoading(false);
          setUploaded(true);
        }
      );
    } else {
      console.log("failed", file.name, file.size);
    }
  };
  return (
    <>
      <div
        className="wrapper"
        style={{
          width: "300px",

          // position: "fixed",
          left: "50%",
          bottom: "0",
          position: "absolute",
          marginBottom: "20px",
        }}
      >
        <div class="window">
          <div class="title-bar">
            <div class="title-bar-text">uploader</div>
            <div class="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div class="window-body" style={{ height: "60px" }}>
            {loading ? (
              // <h2>アップロード中</h2>
              <div class="spinner center">
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
              </div>
            ) : (
              <>
                {uploaded ? (
                  <>
                    <h4>uploaded!! refrefh the page</h4>
                  </>
                ) : (
                  // <div className="outerBox">

                  <form
                    method="post"
                    action="/"
                    encType="multipart/form-data"
                    onSubmit={OnFileUploadtoFirebase}
                  >
                    <button>
                      <input id="glbInput" type="file" accept=".gltf" />
                      <input type="submit" />
                    </button>
                  </form>

                  // </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <div class="window" style={{ width: "80%" }}>
        <div class="title-bar">
          <div class="title-bar-text">meta</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div
          class="window-body"
          style={{
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            flexWrap: "wrap",
            // position: "relative",
          }}
        >
          <Three />

          <ImageUploader />
        </div>
      </div>
    </div>
  );
}

function Rotate(props) {
  const ref = useRef();
  useFrame((state) => (ref.current.rotation.y = state.clock.elapsedTime));
  return <group ref={ref} {...props} />;
}
export default App;
