import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const Modal = ({ page_text, closeModal, searchTerm }) => {
  const modalContentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeModal]);

  const highlightText = (text, term) => {
    if (!term.trim()) return text;

    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const paragraphs = page_text
    .split("\n")
    .map((text, index) => <p key={index}>{highlightText(text, searchTerm)}</p>);

  return (
    <div className="modal">
      <div className="modal-content" ref={modalContentRef}>
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        {paragraphs}
      </div>
    </div>
  );
};

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [modalPageText, setModalPageText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [evidencePages, setEvidencePages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/evidence_pages.json");
        const data = await response.json();
        setEvidencePages(data);
      } catch (error) {
        console.error("Failed to fetch evidence pages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (pageText) => {
    setModalPageText(pageText);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    const results = evidencePages
      .map((page) => ({
        ...page,
        pages: page.pages.filter((subPage) =>
          subPage.page_text.toLowerCase().includes(query.toLowerCase())
        ),
      }))
      .filter(
        (page) =>
          page.evidence_title.toLowerCase().includes(query.toLowerCase()) ||
          page.pages.length > 0
      );

    if (searchSubmitted) {
      setFilteredResults(results);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchSubmitted(true);

    const results = evidencePages
      .map((page) => ({
        ...page,
        pages: page.pages.filter((subPage) =>
          subPage.page_text.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(
        (page) =>
          page.evidence_title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) || page.pages.length > 0
      );

    setFilteredResults(results);
  };

  if (isLoading) {
    return <div className="App">Loading the evidence data...</div>;
  }

  return (
    <div className="App">
      <h1>Post Office Horizon IT Inquiry Evidence Search</h1>
      <div className="searchForm">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      <div className="results">
        <p>
          {filteredResults.length} result(s) found
        </p>
        <table>
          <thead>
            <tr>
              <th>Evidence Title</th>
              <th>Pages</th>
              <th>Inquiry Page</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, index) => (
              <tr key={index}>
                <td>
                  <strong>{result.evidence_title}</strong>
                </td>
                <td>
                  {result.pages.length > 0 ? (
                    <ul className="page-list">
                      {result.pages.map((subPage, subIndex) => (
                        <li
                          key={subIndex}
                          className="clickable-page"
                          onClick={() => openModal(subPage.page_text)}
                        >
                          Page {subPage.page_number}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No matching pages found."
                  )}
                </td>
                <td>
                  <a
                    href={`https://www.postofficehorizoninquiry.org.uk${result.evidence_link}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <Modal
          page_text={modalPageText}
          closeModal={closeModal}
          searchTerm={searchQuery}
        />
      )}
    </div>
  );
}

export default App;
