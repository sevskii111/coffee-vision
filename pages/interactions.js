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
import CLASSES from "../classes";


const Interactions = () => {
  const user = useUser({ redirectTo: "/login" });

  const [interactions, setInteractions] = useState([]);
  const [inters, setInters] = useState([]);

  useEffect(() => {
    if (user) {
      const interNames = [...CLASSES].concat(user.userLabels);

      setInters([...CLASSES].concat(user.userLabels));
    }
  }, [user]);

  if (interactions) {
    return (
      <Layout>
        <Container>
          <Row>
            <Col xs={12} className="text-end bg-light p-3 border-1">
              <FormGroup row>
                <Col xs={6}>
                  <Input type="select">
                    {inters.map((inter) => (
                      <option key={inter}>{inter}</option>
                    ))}
                  </Input>
                </Col>
                <Col xs={6}>
                  <Input type="select">
                    {inters.map((inter) => (
                      <option key={inter}>{inter}</option>
                    ))}
                  </Input>
                </Col>
                <Col xs={6} className="mt-1">
                    <Input placeholder="Название"></Input>
                    </Col>
                <Col xs={4}  className="mt-1">
                  <Input type="select">
                    <option>Пересечение</option>
                    <option>Сложение</option>
                    <option>Вычитание</option>
                  </Input>
                </Col>
                <Col xs={2}  className="mt-1">
                  <Button color="success">Создать</Button>
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

export default Interactions;
