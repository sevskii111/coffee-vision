import { useUser } from "../lib/hooks";
import Layout from "../components/layout";
import {
  Button,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Row,
} from "reactstrap";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import CLASSES from "../classes";

const Notifications = () => {
  const user = useUser({ redirectTo: "/login" });

  const [notifications, setNotifications] = useState([]);

  const [notifs, setNotifs] = useState([]);
  const [left, setLeft] = useState("");
  const [sign, setSign] = useState("=");
  const [right, setRight] = useState("");
  const [c, setC] = useState(0);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("0.0;0.0;999.0");
  const [timerange, setTimerange] = useState("00:00-23:59");

  useEffect(async () => {
    if (user) {
      let inters_array = [];
      for (const [class_ind, cls] of Object.entries(CLASSES)) {
        inters_array.push([`sc_${class_ind}`, cls]);
      }
      for (const [class_ind, cls] of Object.entries(user.userLabels)) {
        inters_array.push([`uc_${class_ind}`, cls]);
      }
      setLeft(inters_array[0][0]);
      setRight("const");
      setNotifs(inters_array);

      setNotifications(await (await fetch("/api/get_notifications")).json());
    }
  }, [user]);

  function codeToName(code) {
    if (code.slice(0, 2) == "sc") {
      return CLASSES[parseInt(code.slice(3))];
    } else {
      return user.userLabels[parseInt(code.slice(3))];
    }
  }

  if (notifications) {
    return (
      <Layout>
        <Container>
          {notifications.map((n) => (
            <Row className="p-2 bg-light my-1" key={n._id}>
              <Col>{n.name}</Col>
              <Col>
                {codeToName(n.left)}
                {"\t"}
                {n.sign}
                {"\t"}
                {n.right == "const" ? n.c : codeToName(n.right)}
              </Col>
                <Col>{n.timerange}</Col>
                <Col>Отображение места в планах</Col>
              <Col xs={1}>
                <Button
                  color="danger"
                  size="sm"
                  onClick={async () => {
                    await fetch(`/api/delete_notification?id=${n._id}`);
                    setNotifications(
                      await (await fetch("/api/get_notifications")).json()
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </Col>
            </Row>
          ))}
          <Row>
            <Col xs={12} className="text-end bg-light p-3 border-1">
              <FormGroup row>
                <Col xs={5}>
                  <Input
                    type="select"
                    value={left}
                    onChange={(e) => setLeft(e.target.value)}
                  >
                    {notifs.map((inter) => (
                      <option key={inter[0]} value={inter[0]}>
                        {inter[1]}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col xs={2} className="mt-1">
                  <Input
                    type="select"
                    value={sign}
                    onChange={(e) => setSign(e.target.value)}
                  >
                    <option>{"<"}</option>
                    <option>{"="}</option>
                    <option>{">"}</option>
                  </Input>
                </Col>
                <Col xs={5}>
                  <Input
                    type="select"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                  >
                    {notifs.map((inter) => (
                      <option key={inter[0]} value={inter[0]}>
                        {inter[1]}
                      </option>
                    ))}
                    <option value="const">Число</option>
                  </Input>
                  {right === "const" ? (
                    <Input
                      type="number"
                      value={c}
                      onChange={(e) => setC(Math.max(e.target.value, 0))}
                    />
                  ) : null}
                </Col>
                <Col xs={4} className="mt-1">
                  <Input
                    placeholder="00:00-23:59"
                    value={timerange}
                    onChange={(e) => setTimerange(e.target.value)}
                  ></Input>
                </Col>
                <Col xs={8} className="mt-1 position-relative">
                  <Input
                    type="select"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="0.0;0.0;999.0">Любое местоположение</option>
                    <option value="55.799814740146104;49.10898496687464;0.117">
                      Казань (радиус 30 км)
                    </option>
                    <option value="54.89647690428905;52.295943492751114;0.030">
                      Альметьевск (радиус 9 км)
                    </option>
                  </Input>
                  <div
                    style={{
                      position: "absolute",
                      right: "-200px",
                      top: "0px",
                      width: "200px",
                    }}
                  >
                    В планах добавить удобный способ указать место и радиус на
                    карте
                  </div>
                </Col>
                <Col xs={9} className="mt-1">
                  <Input
                    placeholder="Название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  ></Input>
                </Col>

                <Col xs={3} className="mt-1">
                  <Button
                    color="success"
                    onClick={async () => {
                      if (!timerange.match(/\d{2}:\d{2}-\d{2}:\d{2}/)) {
                        return alert(
                          "Введите временной промежуток в формате 00:00-23:59"
                        );
                      }
                      await fetch("/api/add_notification", {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          left,
                          sign,
                          right,
                          c,
                          name,
                          timerange,
                          location,
                        }),
                      });
                      setNotifications(
                        await (await fetch("/api/get_notifications")).json()
                      );
                    }}
                  >
                    Создать
                  </Button>
                </Col>
              </FormGroup>
            </Col>
          </Row>
        </Container>
      </Layout>
    );
  } else {
    return <Layout />;
  }
};

export default Notifications;
