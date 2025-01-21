import React, { useEffect, useLayoutEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import "./PromptCard.scss";
/**
 * A container which has a higher z-index than the rest of the page.
 * @param {object} props
 * @param {boolean} props.openPrompt - Whether the prompt card is open or not.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpenPrompt - A function to set the open state of the prompt card.
 * @param {boolean} props.enableBodyOverflow - Whether to disable the overflow of the <body> element.
 * @param {function?} props.handlePromptClose - A function to handle the closing of the prompt card.
 * @param {object} props.baseConfigs - Configurations for the base container.
 * @param {string} props.baseConfigs.id - The id of the base container.
 * @param {React.CSSProperties} props.baseConfigs.style - The style of the base container.
 * @param {string} props.baseConfigs.className - The class name of the base container.
 * @param {object} props.groundConfigs - Configurations for the ground container.
 * @param {string} props.groundConfigs.id - The id of the ground container.
 * @param {React.CSSProperties} props.groundConfigs.style - The style of the ground container.
 * @param {string} props.groundConfigs.className - The class name of the ground container.
 * @param {object} props.mainConfigs - Configurations for the main container.
 * @param {string} props.mainConfigs.id - The id of the main container.
 * @param {React.CSSProperties} props.mainConfigs.style - The style of the main container.
 * @param {string} props.mainConfigs.className - The class name of the main container.
 */
const PromptCard = ({
  openPrompt,
  setOpenPrompt,
  enableBodyOverflow,
  handlePromptClose = null,
  baseConfigs = {
    id: "",
    style: {},
    className: "",
  },
  groundConfigs = {
    id: "",
    style: {},
    className: "",
  },
  mainConfigs = {
    id: "",
    style: {},
    className: "",
  },
  children,
}) => {
  useEffect(() => {
    if (!enableBodyOverflow) {
      if (openPrompt) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }, [openPrompt]);

  return (
    openPrompt && (
      <div
        id={baseConfigs.id || ""}
        style={baseConfigs.style || {}}
        className={`prompt-card-base ${baseConfigs.className || ""}`}
        onClick={(e) => {
          if (handlePromptClose) {
            handlePromptClose();
          } else {
            setOpenPrompt(false);
          }
        }}
      >
        <div
          id={groundConfigs.id || ""}
          style={groundConfigs.style || {}}
          className={`prompt-card-ground ${groundConfigs.className || ""}`}
        >
          <div
            id={mainConfigs.id || ""}
            style={mainConfigs.style || {}}
            className={`prompt-card-main ${mainConfigs.className || ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    )
  );
};

export default PromptCard;

const PromptContent = ({ children }) => {
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const contentHeight = `calc(${contentRef.current.parentElement.style.height} - ${contentRef.current.previousSibling.style.height})`;
      contentRef.current.style.height = contentHeight;
      contentRef.current.style.maxHeight = contentHeight;
    }
  }, []);

  return (
    <div className="prompt-card-content" ref={contentRef}>
      {children}
    </div>
  );
};

/**
 * The header of the prompt card.
 * @param {object} props
 * @param {function} props.handlePromptClose - The function to close the prompt.
 * @param {string} props.title - The title of the prompt.
 * @param {React.JSX.Element} props.children - The children of the header. This element will be placed between the title and the close button.
 */
const PromptHeader = ({ handlePromptClose, title, children }) => {
  return (
    <div className="prompt-card-header" style={{ height: "40px" }}>
      <div className="prompt-card-title">{title}</div>
      {children}
      <div className="prompt-card-close" onClick={handlePromptClose}>
        <IoClose />
      </div>
    </div>
  );
};

export { PromptContent, PromptHeader, PromptCard };
