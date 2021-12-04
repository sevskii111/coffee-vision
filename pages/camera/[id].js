import { useRouter } from "next/router";
//import clientPromise from "../../lib/mongodb";
import cameras from "../../cameras";
import Layout from "../../components/layout";
import { Row, Col, Button, ButtonGroup } from "reactstrap";
import { useEffect, useState } from "react";
import CLASSES from "../../classes";
import Slider, { createSliderWithTooltip } from "rc-slider";
import { useUser } from "../../lib/hooks";

const COLORS = [
  "8dbf3b",
  "4d9de0",
  "e15554",
  "e1bc29",
  "3bb273",
  "7768ae",
  "fface4",
  "08605f",
  "45f0df",
  "ed74e5",
];

const SliderWithTooltip = createSliderWithTooltip(Slider);

const Camera = ({ camera }) => {
  const user = useUser();
  const [heatmaps, setHeatmaps] = useState([]);
  const [heatmapInd, setHeatmapInd] = useState(0);
  const router = useRouter();

  let { qtimestamp } = router.query;
  if (!qtimestamp) {
    qtimestamp = Date.now();
  }
  const [timestamp, setTimesstamp] = useState(qtimestamp);

  useEffect(async () => {
    const hmaps = await (await fetch("/api/heatmaps")).json();

    for (var i = 0; i < hmaps.length; i++) {
      if (hmaps[i].timestamp >= qtimestamp) {
        setHeatmapInd(i);
        break;
      }
    }
    if (i == hmaps.length) {
      setHeatmapInd(hmaps.length - 1);
    }
    setHeatmaps(hmaps);
  }, []);

  useEffect(async () => {
    if (heatmapInd < heatmaps.length) {
      setTimesstamp(heatmaps[heatmapInd].timestamp);
    }
  }, [heatmapInd, heatmaps]);

  useEffect(async () => {
    setLastFrame(
      await (
        await fetch(
          `/api/get_closest_camera_frame?id=${camera.id}&timestamp=${parseInt(
            timestamp / 1000
          )}`,
          {
            credentials: "include",
            mode: "cors",
          }
        )
      ).json()
    );
  }, [timestamp]);

  const [showClassNames, setShowClassNames] = useState(false);
  const [lastFrame, setLastFrame] = useState(null);

  // useEffect(() => {
  //   updateLastFrame();
  // }, []); // empty bracket calls the useEffect callback on initial render
  //setInterval(updateLastFrame, 10 * 1000)

  const toggleShowClassNames = () => {
    setShowClassNames(!showClassNames);
  };

  const bbox_divs = [];
  if (lastFrame && user) {
    for (let i = 0; i < lastFrame.boxes.length; i++) {
      const label = lastFrame.labels[i];
      //const score = lastFrame.scores[i];
      const bbox = lastFrame.boxes[i];
      const color = `#${COLORS[label % COLORS.length]}`;
      bbox_divs.push(
        <div
          style={{
            width: `${bbox[2] * 100}%`,
            height: `${bbox[3] * 100}%`,
            left: `${bbox[0] * 100}%`,
            top: `${bbox[1] * 100}%`,
            border: `solid 2px ${color}`,
            color: `${color}`,
            fontSize: "16px",
          }}
          key={i}
          className="position-absolute bbox"
        >
          <div className="bbox-label" hidden={!showClassNames}>
            {CLASSES[label]}
          </div>
        </div>
      );
    }
  }
  return (
    <Layout>
      <Row>
        <Col xs={12}>
          <Row>
            <Col xs={12} md={6} hidden={!user}>
              <ButtonGroup>
                {showClassNames ? (
                  <Button onClick={toggleShowClassNames}>
                    Скрыть все названия классов
                  </Button>
                ) : (
                  <Button onClick={toggleShowClassNames}>
                    Показать все названия классов
                  </Button>
                )}
                <Button href={`/camera/edit/${camera.id}`}>
                  Изменить статичные объекты
                </Button>
              </ButtonGroup>
            </Col>
            <Col xs={12} md={6} className="d-flex align-items-center">
              <SliderWithTooltip
                key="timeline"
                onChange={setHeatmapInd}
                value={heatmapInd}
                tipFormatter={(v) =>
                  v < heatmaps.length && heatmaps[v]
                    ? new Date(
                        heatmaps[v].timestamp + 10800000
                      ).toLocaleString()
                    : 0
                }
                max={heatmaps ? heatmaps.length - 1 : 0}
              />
            </Col>
          </Row>
        </Col>
        <Col xs={10}>
          <div className="position-relative">
            <img
              className="w-100"
              src={
                lastFrame
                  ? (user ? `/dataset/${camera.id}/${lastFrame.timestamp}` : '/camera.jpg')
                  : null
              }
            />
            {bbox_divs}
          </div>
        </Col>
        <Col xs={2}>
          {lastFrame
            ? [...new Set(lastFrame.labels)].map((l) => (
                <p>
                  {CLASSES[l]}:{" "}
                  {lastFrame.labels.filter((la) => la == l).length}
                </p>
              ))
            : null}
        </Col>
      </Row>
    </Layout>
  );
};

export async function getServerSideProps({ query }) {
  // Fetch data from external API
  //const db = (await clientPromise).db();

  const { id } = query;

  const camera = cameras.find((c) => c.id == id);
  // Pass data to the page via props
  return {
    props: {
      camera,
    },
  };
}

export default Camera;
