import React, { useState, useEffect, useRef } from "react";

const App = () => {
    // Core State
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");

    // Modal Control
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    // Form / Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        codeSnippet: "",
        videoUrl: "",
        tags: ""
    });

    const API_BASE = "http://localhost:9090/api/v1/category";

    // Fetch Initial Data
    useEffect(() => {
        fetch(`${API_BASE}`)
            .then(res => res.json())
            .then(json => {
                setItems(json.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                setLoading(false);
            });
    }, []);

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    // --- ACTIONS ---

    const handleOpenAdd = () => {
        setIsEditing(false);
        setActiveTab("basic");
        setSelectedFile(null);
        setFormData({ name: "", description: "", codeSnippet: "", videoUrl: "", tags: "" });
        setShowModal(true);
    };

    const handleOpenEdit = (component) => {
        setIsEditing(true);
        setActiveTab("basic");
        setSelectedFile(null);
        setCurrentId(component._id || component.id);
        setFormData({
            name: component.name,
            description: component.description,
            codeSnippet: component.codeSnippet || "",
            videoUrl: component.videoUrl || "",
            tags: component.tags ? component.tags.join(", ") : ""
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const categoryId = items[selectedCategory]._id;

        // Using FormData for Multipart Support (Backend must use @ModelAttribute)
        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("codeSnippet", formData.codeSnippet);
        data.append("videoUrl", formData.videoUrl);
        data.append("tags", formData.tags);
        
        if (selectedFile) {
            data.append("gifFile", selectedFile);
        }

        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing
            ? `${API_BASE}/${categoryId}/component/${currentId}`
            : `${API_BASE}/${categoryId}/component`;

        fetch(url, {
            method: method,
            body: data // Content-Type header is handled automatically by the browser
        })
        .then(res => res.json())
        .then(response => {
            if (response.status) {
                const savedComponent = response.data;
                const updatedItems = items.map((item, index) => {
                    if (index === selectedCategory) {
                        const newComponents = isEditing
                            ? (item.component || []).map(c => (c._id === currentId || c.id === currentId) ? savedComponent : c)
                            : [...(item.component || []), savedComponent];
                        return { ...item, component: newComponents };
                    }
                    return item;
                });
                setItems(updatedItems);
                setShowModal(false);
                triggerSuccess(response.msg || "Component saved!");
            }
        })
        .catch(err => console.error("Save Error:", err));
    };

    const executeDelete = () => {
        if (!idToDelete || selectedCategory === null || !items[selectedCategory]) return;
        
        const categoryId = items[selectedCategory]._id;

        fetch(`${API_BASE}/${categoryId}/component/${idToDelete}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(response => {
                if (response.status) {
                    const updatedItems = items.map((item, index) => {
                        if (index === selectedCategory) {
                            return {
                                ...item,
                                component: item.component.filter(c => (c._id !== idToDelete && c.id !== idToDelete))
                            };
                        }
                        return item;
                    });
                    setItems(updatedItems);
                    setShowDeleteModal(false);
                    setIdToDelete(null);
                    triggerSuccess(response.msg || "Component removed");
                }
            })
            .catch(err => console.error("Delete error:", err));
    };

    // --- RENDER HELPERS ---

    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center text-muted">Page is Loading ...</div>;
    
    const activeCategory = items[selectedCategory];

    return (
        <div className="d-flex vh-100 overflow-hidden bg-white">
            {/* Sidebar */}
            <aside className="border-end bg-light d-flex flex-column" style={{ width: '280px' }}>
                <div className="p-4 border-bottom bg-white d-flex align-items-center gap-2">
                    <i className="bi bi-terminal-box text-primary fs-4"></i>
                    <h5 className="fw-bold m-0">PatternHub</h5>
                </div>
                <div className="flex-grow-1 overflow-auto p-2">
                    {items.map((item, idx) => (
                        <button key={item._id || idx} onClick={() => setSelectedCategory(idx)}
                            className={`btn w-100 text-start border-0 mb-1 p-3 rounded-3 ${selectedCategory === idx ? 'bg-white shadow-sm text-primary fw-bold' : 'text-secondary hover-bg'}`}>
                            {item.name}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <header className="px-4 py-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h3 className="fw-bold m-0">{activeCategory?.name || "Select Category"}</h3>
                    <button className="btn btn-primary px-4 fw-bold rounded-pill" onClick={handleOpenAdd}>
                        <i className="bi bi-plus-circle me-1"></i> New Component
                    </button>
                </header>

                <main className="flex-grow-1 overflow-auto p-4 bg-light-subtle">
                    <div className="row g-4">
                        {activeCategory?.component?.map((child) => (
                            <div className="col-12 col-md-6 col-xl-4" key={child._id || child.id}>
                                <div className="card h-100 border-0 shadow-sm border-top border-4 border-primary">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between mb-2">
                                            <h5 className="fw-bold">{child.name}</h5>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-light" onClick={() => handleOpenEdit(child)}><i className="bi bi-pencil"></i></button>
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => {setIdToDelete(child._id || child.id); setShowDeleteModal(true)}}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                        <p className="text-muted small">{child.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="position-fixed bottom-0 end-0 m-4 p-3 bg-dark text-white rounded-3 shadow-lg" style={{ zIndex: 3000 }}>
                    <i className="bi bi-check-circle-fill text-success me-2"></i> {successMessage}
                </div>
            )}

            {/* ADD/EDIT MODAL */}
            {showModal && (
                <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header px-4 pt-4 border-0">
                                <h5 className="fw-bold">{isEditing ? "Modify Component" : "Configure New Component"}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            
                            <ul className="nav nav-tabs px-4 border-0">
                                {["basic", "code", "media"].map(tab => (
                                    <li className="nav-item" key={tab}>
                                        <button className={`nav-link border-0 ${activeTab === tab ? 'active border-bottom border-primary fw-bold' : ''}`} 
                                            onClick={() => setActiveTab(tab)}>
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <form onSubmit={handleSave}>
                                <div className="modal-body px-4 py-4" style={{ minHeight: '350px' }}>
                                    {activeTab === "basic" && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">COMPONENT NAME</label>
                                                <input type="text" className="form-control p-2" required value={formData.name}  onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">DESCRIPTION</label>
                                                <textarea className="form-control p-2" rows="3" value={formData.description}  onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">TAGS (Comma separated)</label>
                                                <input type="text" className="form-control p-2" placeholder="e.g. Java, Security" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === "code" && (
                                        <div className="mb-3">
                                            <textarea className="form-control font-monospace p-3 bg-dark text-white" rows="10" placeholder="Paste your code here..." value={formData.codeSnippet} onChange={(e) => setFormData({...formData, codeSnippet: e.target.value})}></textarea>
                                        </div>
                                    )}

                                    {activeTab === "media" && (
                                        <div className="d-flex flex-column gap-4">
                                            <div className="p-4 border rounded-3 bg-light text-center">
                                                <label className="form-label d-block small fw-bold mb-3 text-start">COMPONENT PREVIEW (GIF/IMAGE)</label>
                                                <input type="file" ref={fileInputRef} accept="image/*" className="d-none" onChange={(e) => setSelectedFile(e.target.files[0])} />
                                                <div className="mb-2">
                                                    {selectedFile ? (
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <i className="bi bi-file-earmark-image fs-3 text-primary"></i>
                                                            <span className="fw-semibold">{selectedFile.name}</span>
                                                            <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => setSelectedFile(null)}><i className="bi bi-x-lg"></i></button>
                                                        </div>
                                                    ) : (
                                                        <button type="button" className="btn btn-outline-primary px-4 py-2" onClick={() => fileInputRef.current.click()}>
                                                            <i className="bi bi-cloud-upload me-2"></i> Upload File
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label small fw-bold">VIDEO TUTORIAL URL</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-white"><i className="bi bi-link-45deg"></i></span>
                                                    <input type="url" className="form-control" placeholder="https://..." value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-0 px-4 pb-4">
                                    <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 2000, backdropFilter: 'blur(2px)' }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 text-danger"><i className="bi bi-exclamation-circle fs-1"></i></div>
                                <h5 className="fw-bold">Remove Component?</h5>
                                <p className="text-muted small">Are you sure you want to delete this? This action cannot be undone.</p>
                                <div className="d-flex gap-2 mt-4">
                                    <button className="btn btn-light w-100" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                    <button className="btn btn-danger w-100" onClick={executeDelete}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;