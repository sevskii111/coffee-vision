import { useEffect, useRef, useState } from "react";
import { Annotorious } from "@recogito/annotorious";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import "crypto";

import "@recogito/annotorious/dist/annotorious.min.css";
import {
  Button,
  ButtonGroup,
  Col,
  FormGroup,
  Input,
  Label,
  ListGroup,
  ListGroupItem,
  Row,
} from "reactstrap";

function AnnotoriousComponent({
  handleCancel,
  handleSave,
  src,
  labels,
  annotationsUrl,
}) {
  const imgEl = useRef();
  const [anno, setAnno] = useState();
  const [active, setActive] = useState(0);
  const [tool, setTool] = useState("rect");
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [nextAnnoInd, setNextAnnoInd] = useState(0);

  const getOrderedAnnotations = () => {
    return annotations.sort((a, b) => a.body.ind - b.body.ind);
  };

  const labels_to_colors = {};
  for (let i = 0; i < labels.length; i++) {
    labels_to_colors[labels[i]] = "c" + i;
  }

  const formatter = function (annotation) {
    var highlightBody = annotation.bodies.find(function (b) {
      return b.purpose == "highlighting";
    });
    if (highlightBody) return 'c' + highlightBody.value;
  };

  useEffect(async () => {
    let annotorious = null;

    if (imgEl.current) {
      annotorious = new Annotorious({
        image: imgEl.current,
        allowEmpty: true,
        disableEditor: true,
        formatter: formatter,
      });

      if (annotationsUrl) {
        const loadedAnnotations = await (await fetch(annotationsUrl, {credentials: 'include'})).json();
        let maxInd = 0;
        for (const annotation of loadedAnnotations) {
          await annotorious.addAnnotation(annotation, annotation.body.readOnly);
          maxInd = Math.max(maxInd, annotation.body.ind);
        }
        setNextAnnoInd(maxInd + 1);
        //await annotorious.loadAnnotations(annotationsUrl);
        setAnnotations(annotorious.getAnnotations());
      }
      document.body.addEventListener("keyup", async function (evt) {
        if (evt.which === 46) {
          var selected = annotorious.getSelected();
          if (selected) {
            await annotorious.removeAnnotation(selected);
            await setAnnotations(annotorious.getAnnotations());
          }
        }
      });

      annotorious.on("createAnnotation", function (selection) {
        setAnnotations(annotorious.getAnnotations());
      });

      annotorious.on("changeSelectionTarget", function (selection) {
        setAnnotations(annotorious.getAnnotations());
      });

      annotorious.on("selectAnnotation", async function (annotation, element) {
        if (!annotation.body.readOnly) {
          setSelectedAnnotation(annotation);
        } else {
          await annotorious.cancelSelected();
        }

      });

      annotorious.on("cancelSelected", function (selection) {
        setSelectedAnnotation(null);
      });
    }

    setAnno(annotorious);
    return () => annotorious.destroy();
  }, []);

  useEffect(async () => {
    if (anno) {
      anno.off("createSelection");
      anno.on("createSelection", async function (selection) {
        selection.body = {
          value: active,
          purpose: "highlighting",
          count: 1,
          ind: nextAnnoInd,
        };
        setNextAnnoInd(nextAnnoInd + 1);
        await anno.updateSelected(selection, true);
      });
    }
  }, [anno, active, nextAnnoInd]);

  const annotationItems = getOrderedAnnotations().map((item) => (
    <ListGroupItem
      key={item.id}
      onClick={async () => {
        await anno.saveSelected();
        if (!item.body.readOnly) {
          anno.selectAnnotation(item);
        }
        setSelectedAnnotation(item);
      }}
      active={item.id == selectedAnnotation?.id}
    >
      <Row>
        <Label xs={12}>{labels[item.body.value]}</Label>
        <Col xs={6}>
          <Input
            value={item.body.count}
            onChange={async (e) => {
              const value = e.target.value;
              item.body.count = value;
              await anno.selectAnnotation(item);
              await anno.updateSelected(item);
              if (!item.body.readOnly) {
                await anno.selectAnnotation(item);
              }
              setSelectedAnnotation(item);
              setAnnotations(anno.getAnnotations());
            }}
            type="number"
          />
        </Col>
        <Col xs={6}>
          <Button
            color="secondary"
            onClick={async () => {
              await anno.removeAnnotation(item);
              setAnnotations(anno.getAnnotations());
            }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Col>
      </Row>
    </ListGroupItem>
  ));

  const addFullscreenAnnotation = async () => {
    const imageSize = [imgEl.current.naturalWidth, imgEl.current.naturalHeight];
    const fullScreenAnnotation = {
      type: "Annotation",
      body: {
        value: active,
        purpose: "highlighting",
        count: 1,
        ind: nextAnnoInd,
        readOnly: true,
      },
      id: crypto.randomUUID(),
      target: {
        source: imgEl.current.src,
        selector: {
          type: "FragmentSelector",
          conformsTo: "http://www.w3.org/TR/media-frags/",
          value: `xywh=pixel:0,0,${imageSize[0]},${imageSize[1]}`,
        },
      },
      "@context": "http://www.w3.org/ns/anno.jsonld",
    };
    setNextAnnoInd(nextAnnoInd + 1);
    await anno.addAnnotation(fullScreenAnnotation, true);
    setAnnotations(anno.getAnnotations());
  };

  return (
    <div className="mt-3">
      <div>
        <div className="">Для удаления зоны выберете её и нажмите Del</div>
        <div className="d-flex justify-content-between">
          <ButtonGroup>
            <Button
              onClick={() => setTool("rect") || anno.setDrawingTool("rect")}
              color={tool == "rect" ? "primary" : "secondary"}
            >
              Прямоугольник
            </Button>
            <Button
              onClick={() =>
                setTool("polygon") || anno.setDrawingTool("polygon")
              }
              color={tool != "rect" ? "primary" : "secondary"}
            >
              Многоугольник
            </Button>
            <Button onClick={addFullscreenAnnotation} color="info">
              Весь кадр
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button color="danger" onClick={handleCancel}>
              Отменить
            </Button>
            <Button
              color="success"
              onClick={async () => {
                await anno.saveSelected();
                handleSave(anno.getAnnotations());
                handleCancel();
              }}
            >
              Сохранить
            </Button>
          </ButtonGroup>
        </div>
      </div>
      <Row className="bg-light">
        <Col xs={10}>
          <img ref={imgEl} src={src} style={{ width: "100%" }} />
        </Col>
        <Col xs={2}>
          <ListGroup>{annotationItems}</ListGroup>
        </Col>
      </Row>
      <ButtonGroup>
        {Object.entries(labels).map(([ind, label]) => (
          <Button
            key={ind}
            onClick={() => setActive(ind)}
            color={active == ind ? "primary" : "secondary"}
            className={`btn-c${ind}`}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}

export default AnnotoriousComponent;
