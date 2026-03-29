import { useState, useEffect } from 'react'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<number | null>(null)
  const [status, setStatus] = useState<string>("Waiting for file...")
  const [extractedData, setExtractedData] = useState<any>(null)
  const [allDocuments, setAllDocuments] = useState<any[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFormText, setEditFormText] = useState<string>("")

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [sortField, setSortField] = useState<string>("id") 
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (jobId && (status === "Queued" || status === "Processing")) {
      interval = setInterval(async () => {
        try {
          // FIXED: Backticks and ${}
          const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${jobId}`);
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
      // FIXED: Backticks and ${}
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllDocuments(data);
      }
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
      // FIXED: Backticks and ${}
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/`, { method: "POST", body: formData });
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
      // This one was actually correct in your file!
      await fetch(`${import.meta.env.VITE_API_URL}/documents/${docId}/finalize`, {
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
      // FIXED: Backticks and ${}
      await fetch(`${import.meta.env.VITE_API_URL}/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch (error) {
      alert("Failed to delete the document.");
    }
  };

  const handleExportJSON = () => {
    // FIXED: Backticks and ${}
    window.open(`${import.meta.env.VITE_API_URL}/export/json`, "_blank");
  };

  const handleExportCSV = () => {
    // FIXED: Backticks and ${}
    window.open(`${import.meta.env.VITE_API_URL}/export/csv`, "_blank");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); 
    }
  };

  let displayedDocuments = [...allDocuments];

  if (searchTerm) {
    displayedDocuments = displayedDocuments.filter(doc => 
      (doc.filename && doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (doc.id && doc.id.toString().includes(searchTerm))
    );
  }

  if (statusFilter !== "All") {
    displayedDocuments = displayedDocuments.filter(doc => doc.status === statusFilter);
  }

  displayedDocuments.sort((a, b) => {
    let valA = a[sortField] !== null && a[sortField] !== undefined ? a[sortField] : "";
    let valB = b[sortField] !== null && b[sortField] !== undefined ? b[sortField] : "";
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "950px", margin: "0 auto" }}>
      <h1>Document Processing System</h1>
      <p>Upload a document to simulate asynchronous data extraction.</p>
      
      <div style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f0f4f8", borderRadius: "8px" }}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ padding: "10px 15px", marginLeft: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Upload & Process
        </button>
      </div>

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

      <div style={{ display: "flex", gap: "15px", margin: "20px 0", padding: "15px", backgroundColor: "#e9ecef", borderRadius: "8px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Search:</label>
          <input 
            type="text" 
            placeholder="Search by filename or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px", width: "70%", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>
        <div>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Filter Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "150px" }}
          >
            <option value="All">All Statuses</option>
            <option value="Queued">Queued</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Finalized">Finalized</option>
          </select>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
            <th onClick={() => handleSort("id")} style={{ padding: "12px", cursor: "pointer", userSelect: "none", width: "80px" }}>
              ID {sortField === "id" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </th>
            <th onClick={() => handleSort("filename")} style={{ padding: "12px", cursor: "pointer", userSelect: "none" }}>
              Filename {sortField === "filename" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </th>
            <th onClick={() => handleSort("status")} style={{ padding: "12px", cursor: "pointer", userSelect: "none", width: "120px" }}>
              Status {sortField === "status" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </th>
            <th style={{ padding: "12px" }}>Extracted Data / Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedDocuments.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                No documents match your search or filter.
              </td>
            </tr>
          ) : (
            displayedDocuments.map((doc) => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App