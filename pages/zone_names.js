import { useUser } from "../lib/hooks";
import Layout from "../components/layout";
import { Button, Col, Container, Input, Row } from "reactstrap";
import { useEffect, useState } from "react";

const ZoneNames = () => {
  const user = useUser({ redirectTo: "/login" });

  const [labels, setLabels] = useState([]);

  useEffect(() => {
    if (user) {
      setLabels(user.userLabels);
    }
  }, [user]);

  if (labels) {
    return (
      <Layout>
        <Container>
          <Row>
            {Object.entries(labels).map(([ind, label]) => (
              <Col xs={6} key={ind}>
                <Input
                  key={ind}
                  value={labels[ind]}
                  onChange={({ target }) => {
                    const prevLabels = [...labels];
                    prevLabels[ind] = target.value;
                    setLabels(prevLabels);
                  }}
                />
              </Col>
            ))}
            <Col xs={12} className="text-end">
              <Button
                className="mt-1"
                color="success"
                onClick={async () => {
                  await fetch("/api/save_user_zone_names", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(labels),
                  });
                }}
              >
                Сохранить
              </Button>
            </Col>
          </Row>
        </Container>
      </Layout>
    );
  } else {
    return <Layout />;
  }
};

export default ZoneNames;
