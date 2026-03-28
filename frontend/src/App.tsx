import { useState, useEffect } from 'react'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<number | null>(null)
  const [status, setStatus] = useState<string>("Waiting for file...")
  const [extractedData, setExtractedData] = useState<any>(null)
  const [allDocuments, setAllDocuments] = useState<any[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFormText, setEditFormText] = useState<string>("")

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && (status === "Queued" || status === "Processing")) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/documents/${jobId}`);
          const data = await response.json();
          setStatus(data.status);
          if (data.status === "Completed") {
            setExtractedData(data.extracted_data);
          }
        } catch (error) {}
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/documents/");
      const data = await response.json();
      const sortedData = data.sort((a: any, b: any) => b.id - a.id);
      setAllDocuments(sortedData);
    } catch (error) {}
  };

  useEffect(() => {
    fetchDocuments(); 
    const listInterval = setInterval(fetchDocuments, 3000); 
    return () => clearInterval(listInterval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
    setStatus("Uploading...");
    setExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", { method: "POST", body: formData });
      const data = await response.json();
      setJobId(data.job_id);
      setStatus(data.status);
    } catch (error) {
      setStatus("Upload Failed!");
    }
  };

  const handleEditClick = (doc: any) => {
    setEditingId(doc.id);
    setEditFormText(JSON.stringify(doc.extracted_data, null, 2));
  };

  const handleFinalizeSubmit = async (docId: number) => {
    try {
      const parsedData = JSON.parse(editFormText);
      await fetch(`http://127.0.0.1:8000/documents/${docId}/finalize`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_data: parsedData })
      });
      setEditingId(null);
      fetchDocuments();
    } catch (error) {
      alert("Oops! The data format is invalid. Make sure your quotes and commas are correct.");
    }
  };

  const handleDeleteClick = async (docId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this document?");
    if (!confirmDelete) return;
    try {
      await fetch(`http://127.0.0.1:8000/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch (error) {
      alert("Failed to delete the document.");
    }
  };

  // --- NEW: THE EXPORT BUTTON ACTIONS ---
  // Because the backend sends back a file attachment, we can just open the link directly!
  const handleExportJSON = () => {
    window.open("http://127.0.0.1:8000/export/json", "_blank");
  };

  const handleExportCSV = () => {
    window.open("http://127.0.0.1:8000/export/csv", "_blank");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Document Processing System</h1>
      <p>Upload a document to simulate asynchronous data extraction.</p>
      
      <div style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f0f4f8", borderRadius: "8px" }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ padding: "10px 15px", marginLeft: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Upload & Process
        </button>
      </div>

      {/* NEW: Export Buttons Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "40px", borderBottom: "2px solid #ddd", paddingBottom: "10px" }}>
        <h2 style={{ margin: 0 }}>All Uploaded Documents</h2>
        <div>
          <button onClick={handleExportCSV} style={{ padding: "8px 12px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "10px" }}>
            Export Finalized to CSV
          </button>
          <button onClick={handleExportJSON} style={{ padding: "8px 12px", backgroundColor: "#ffc107", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Export Finalized to JSON
          </button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "12px" }}>ID</th>
            <th style={{ padding: "12px" }}>Filename</th>
            <th style={{ padding: "12px" }}>Status</th>
            <th style={{ padding: "12px" }}>Extracted Data / Actions</th>
          </tr>
        </thead>
        <tbody>
          {allDocuments.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
              <td style={{ padding: "12px" }}>{doc.id}</td>
              <td style={{ padding: "12px" }}>{doc.filename}</td>
              <td style={{ padding: "12px", fontWeight: "bold", color: doc.status === "Finalized" ? "purple" : doc.status === "Completed" ? "green" : "blue" }}>
                {doc.status}
              </td>
              <td style={{ padding: "12px" }}>
                
                {editingId === doc.id ? (
                  <div>
                    <textarea 
                      value={editFormText} 
                      onChange={(e) => setEditFormText(e.target.value)}
                      style={{ width: "100%", height: "120px", fontFamily: "monospace", padding: "8px" }}
                    />
                    <br />
                    <button onClick={() => handleFinalizeSubmit(doc.id)} style={{ marginTop: "8px", padding: "6px 12px", backgroundColor: "purple", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Save & Finalize
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ marginTop: "8px", marginLeft: "8px", padding: "6px 12px", backgroundColor: "gray", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    {doc.extracted_data && (
                       <pre style={{ fontSize: "12px", margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
                         {JSON.stringify(doc.extracted_data, null, 2)}
                       </pre>
                    )}
                    <div>
                      {doc.status === "Completed" && (
                        <button onClick={() => handleEditClick(doc)} style={{ padding: "6px 12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "8px" }}>
                          Review & Edit
                        </button>
                      )}
                      <button onClick={() => handleDeleteClick(doc.id)} style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App