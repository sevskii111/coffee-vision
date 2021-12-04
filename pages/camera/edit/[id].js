import { useRouter } from "next/router";
//import clientPromise from "../../lib/mongodb";
import cameras from "../../../cameras";
import Layout from "../../../components/layout";
import { Row, Col, Button, ButtonGroup } from "reactstrap";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useUser } from "../../../lib/hooks";

const Camera = ({ camera }) => {
  const user = useUser({ redirectTo: "/login" });

  const AnnotoriousComponent = dynamic(
    () => import("../../../components/annotorious"),
    { ssr: false }
  );

  const handleSave = async (newAnnotations) => {
    await fetch("/api/save_user_annotations", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cameraId: camera.id,
        annotations: newAnnotations,
      }),
    });
  };

  return (
    <Layout>
      <AnnotoriousComponent
        handleCancel={() => (window.location = `/camera/${camera.id}`)}
        handleSave={handleSave}
        src={`/api/get_last_camera_frame?id=${camera.id}&frameOnly=1`}
        labels={user ? user.userLabels : []}
        annotationsUrl={`/api/get_user_annotations?cameraId=${camera.id}`}
      />
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
