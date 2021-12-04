import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { divIcon } from "leaflet";
import { faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MarkerClusterGroup from "react-leaflet-markercluster";
import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { ListGroup, ListGroupItem } from "reactstrap";
//import {} from "reactstrap"
import Slider, { createSliderWithTooltip } from "rc-slider";

import CLASSES from "../classes";
import { useUser } from "../lib/hooks";

const SliderWithTooltip = createSliderWithTooltip(Slider);

const Map = ({ cameras }) => {
  const [heatmaps, setHeatmaps] = useState([]);
  const [label, setLabel] = useState(6);
  const [heatmapInd, setHeatmapInd] = useState(0);
  const [heatmap, setHeatmap] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [activeNotifications, setActiveNotifications] = useState({});
  const [mode, setMode] = useState("Ничего");
  const [modes, setModes] = useState(["Тепл. карты"]);
  const user = useUser();

  useEffect(async () => {
    if (user) {
      setModes(["Ничего", "Тепл. карты", "Уведомления"]);
    } else {
      setMode("Тепл. карты");
    }
  }, [user]);

  useEffect(async () => {
    const hmaps = await (await fetch("/api/heatmaps")).json();
    setHeatmapInd(hmaps.length - 1);
    setHeatmaps(hmaps);
    setNotifications(await (await fetch("/api/get_notifications")).json());
  }, []);

  useEffect(async () => {
    if (heatmapInd < heatmaps.length) {
      setHeatmap(heatmaps[heatmapInd].heatmap[label]);
    }
  }, [label, heatmapInd, heatmaps]);
  const iconMarkup = renderToStaticMarkup(
    <FontAwesomeIcon icon={faVideo} style={{ background: "transparent" }} />
  );
  const customMarkerIcon = divIcon({
    html: iconMarkup,
  });

  const cameraMarkers = cameras.map((camera) => {
    if (mode == "Уведомления") {
      const EPS = 0.0001;
      const currHeatmap = heatmaps[heatmapInd];
      let found = false;
      for (const ind of Object.keys(activeNotifications)) {
        const notification = notifications[ind];
        const left = notification.left;
        const right = notification.right;

        let leftValue = 0,
          rightValue = 0;
        if (left.slice(0, 2) == "sc") {
          const classInd = parseInt(left.slice(3));
          if (currHeatmap.heatmap[classInd]) {
            for (const e of currHeatmap.heatmap[classInd]) {
              if (
                Math.abs(e[0] - camera.longitude) < EPS &&
                Math.abs(e[1] - camera.latitude) < EPS
              ) {
                leftValue = e[2];
              }
            }
          }
        }
        if (right == "const") {
          rightValue = parseInt(notification.c);
        } else if (notification.right.slice(0, 2) == "sc") {
          const classInd = parseInt(right.slice(4));
          rightValue = camera.labels.filter((l) => l == classInd).length;
        }
        let f;
        if (notification.sign == "<") {
          f = leftValue < rightValue;
        } else if (notification.sign == "=") {
          f = leftValue == rightValue;
        } else {
          f = leftValue > rightValue;
        }
        const [notificationLng, notificationLat, notificationR] =
          notification.location.split(";");

        if (
          Math.sqrt(
            (camera.longitude - notificationLng) ** 2 +
              (camera.latitude - notificationLat) ** 2
          ) > notificationR
        ) {
          continue;
        }
        const [minHour, minMinute] = notification.timerange
          .split("-")[0]
          .split(":");
        const [maxHour, maxMinute] = notification.timerange
          .split("-")[1]
          .split(":");

        let timestampHour = new Date(currHeatmap.timestamp).getHours() + 3;
        if (timestampHour > 24) {
          timestampHour -= 24;
        }
        const timestampMinute = new Date(currHeatmap.timestamp).getMinutes();

        if (
          minHour < maxHour ||
          (minHour == maxHour && minMinute < maxMinute)
        ) {
          if (
            timestampHour < minHour ||
            (timestampHour == minHour && timestampMinute < minMinute)
          ) {
            continue;
          }

          if (
            timestampHour > maxHour ||
            (timestampHour == maxHour && timestampMinute > maxMinute)
          ) {
            continue;
          }
        } else {
          if (timestampHour < minHour && timestampHour > maxHour) {
            continue;
          } else if (minHour == maxHour) {
            if (timestampMinute < minMinute && timestampMinute > maxMinute) {
              continue;
            }
          }
        }

        if (f) {
          found = true;
          break;
        }
      }

      if (!found) {
        return null;
      }
    }

    return (
      <Marker
        position={[camera.longitude, camera.latitude]}
        icon={customMarkerIcon}
        key={camera.id}
      >
        <Popup>
          <img
            src={`/api/get_closest_camera_frame?id=${
              camera.id
            }&frameOnly=1&timestamp=${
              heatmapInd < heatmaps.length
                ? heatmaps[heatmapInd].timestamp / 1000
                : 9999999999999
            }`}
          />
          <a
            href={`/camera/${camera.id}?qtimestamp=${
              heatmapInd < heatmaps.length
                ? heatmaps[heatmapInd].timestamp
                : 9999999999999
            }`}
          >
            {camera.name}
          </a>
        </Popup>
      </Marker>
    );
  });

  function HeatmapFunction() {
    const addressPoints = heatmap;

    const map = useMap();
    useEffect(() => {
      const points = addressPoints
        ? addressPoints.map((p) => {
            return [p[0], p[1], p[2]]; // lat lng intensity
          })
        : [];
      map.eachLayer(function (layer) {
        if (layer._heat) {
          map.removeLayer(layer);
        }
      });
      if (mode == "Тепл. карты") {
        L.heatLayer(points, { max: 1, radius: 50, blur: 50 }).addTo(map);
      }
    }, []);
    return null;
  }

  return (
    <div>
      <MapContainer
        center={[55.36132911407393, 50.63395146606868]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: 700, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup>{cameraMarkers}</MarkerClusterGroup>
        <HeatmapFunction />
      </MapContainer>
      <div
        style={{
          position: "absolute",
          width: 350,
          top: 5,
          right: 13,
          zIndex: 10000,
        }}
      >
        <ListGroup horizontal>
          {modes.map((m) => (
            <ListGroupItem
              key={m}
              active={mode == m}
              onClick={() => setMode(m)}
              role="button"
            >
              {m}
            </ListGroupItem>
          ))}
        </ListGroup>
        {mode == "Тепл. карты" ? (
          <ListGroup>
            {Object.entries(CLASSES).map(([ind, c]) => (
              <ListGroupItem
                active={label == ind}
                onClick={() => setLabel(ind)}
                key={ind}
                role="button"
              >
                {c}
              </ListGroupItem>
            ))}
          </ListGroup>
        ) : null}
        {mode == "Уведомления" ? (
          <ListGroup>
            <ListGroupItem
              color="info"
              role="button"
              onClick={() => {
                if (
                  Object.keys(activeNotifications).length ==
                  notifications.length
                ) {
                  setActiveNotifications({});
                } else {
                  let newActiveNotifications = {};
                  for (const [i, n] of Object.entries(notifications)) {
                    newActiveNotifications[i] = true;
                  }
                  setActiveNotifications(newActiveNotifications);
                }
              }}
            >
              Все
            </ListGroupItem>
            {Object.entries(notifications).map(([ind, n]) => (
              <ListGroupItem
                active={activeNotifications[ind]}
                onClick={() => {
                  let newActiveNotifications = { ...activeNotifications };
                  if (activeNotifications[ind]) {
                    delete newActiveNotifications[ind];
                  } else {
                    newActiveNotifications[ind] = true;
                  }
                  setActiveNotifications(newActiveNotifications);
                }}
                key={ind}
                role="button"
              >
                {n.name}
              </ListGroupItem>
            ))}
          </ListGroup>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          width: 500,
          bottom: 10,
          left: 20,
          zIndex: 1000,
          backgroundColor: "white",
          padding: 10,
          borderRadius: "10px",
        }}
      >
        <SliderWithTooltip
          key="timeline"
          onChange={setHeatmapInd}
          value={heatmapInd}
          tipFormatter={(v) =>
            v < heatmaps.length && heatmaps[v]
              ? new Date(heatmaps[v].timestamp + 10800000).toLocaleString()
              : 0
          }
          max={heatmaps ? heatmaps.length - 1 : 0}
        />
      </div>
    </div>
  );
};

export default Map;
