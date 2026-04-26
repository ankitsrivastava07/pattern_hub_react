import { useState, useEffect } from "react";

const App = () => {
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [activeTab, setActiveTab] = useState("basic"); // basic | code | media

    const [formData, setFormData] = useState({ 
        name: "", 
        description: "",
        codeSnippet: "",
        videoUrl: "",
        tags: "" // Comma separated input
    });

    const API_BASE = "http://localhost:9090/api/v1/category";

    useEffect(() => {
        fetch(`${API_BASE}`).then(res => res.json()).then(json => {
            setItems(json.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const triggerSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setActiveTab("basic");
        setFormData({ name: "", description: "", codeSnippet: "", videoUrl: "", tags: "" });
        setShowModal(true);
    };

    const handleOpenEdit = (component) => {
        setIsEditing(true);
        setActiveTab("basic");
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
        
        // Prepare payload: Convert tags string back to array
        const payload = { 
            ...formData, 
            tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== "") 
        };

        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing 
            ? `${API_BASE}/${categoryId}/component/${currentId}`
            : `${API_BASE}/${categoryId}/component`;

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(response => {
            if (response.status) {
                const savedComponent = response.data;
                const updatedItems = items.map((item, index) => {
                    if (index === selectedCategory) {
                        const newComponents = isEditing
                            ? item.component.map(c => (c._id === currentId || c.id === currentId) ? savedComponent : c)
                            : [...item.component, savedComponent];
                        return { ...item, component: newComponents };
                    }
                    return item;
                });
                setItems(updatedItems);
                setShowModal(false);
                triggerSuccess(response.msg);
            }
        });
    };

    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center text-muted">Loading System...</div>;
    const activeCategory = items[selectedCategory];

    return (
        <div className="d-flex vh-100 overflow-hidden bg-white">
            {/* SUCCESS TOAST */}
            {successMessage && (
                <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 2000 }}>
                    <div className="alert alert-success shadow border-0 px-4 py-2 fw-bold d-flex align-items-center gap-2">
                        <i className="bi bi-check-circle-fill"></i> {successMessage}
                    </div>
                </div>
            )}

            {/* SIDEBAR (Same as before) */}
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

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <header className="px-4 py-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h3 className="fw-bold m-0">{activeCategory?.name}</h3>
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
                                        
                                        {/* TAGS UI */}
                                        <div className="mb-2">
                                            {child.tags?.map(t => <span key={t} className="badge bg-primary-subtle text-primary border me-1 small">{t}</span>)}
                                        </div>
                                        
                                        <p className="text-muted small">{child.description}</p>
                                        
                                        {/* RESOURCES PREVIEW */}
                                        <div className="mt-3 pt-3 border-top d-flex gap-3">
                                            {child.codeSnippet && <i className="bi bi-code-square text-primary" title="Code Included"></i>}
                                            {child.videoUrl && <i className="bi bi-play-circle-fill text-danger" title="Video Available"></i>}
                                            <i className="bi bi-file-earmark-arrow-down text-success" title="Attachments"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* EXPANDED MODAL WITH TABS */}
            {showModal && (
                <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header px-4 pt-4 border-0">
                                <h5 className="fw-bold">{isEditing ? "Modify Component" : "Configure New Component"}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            
                            {/* TAB NAVIGATION */}
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
                                <div className="modal-body px-4 py-4" style={{ minHeight: '300px' }}>
                                    {activeTab === "basic" && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">COMPONENT NAME</label>
                                                <input type="text" className="form-control p-2" value={formData.name} required
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">DESCRIPTION</label>
                                                <textarea className="form-control p-2" rows="3" value={formData.description} required
                                                    onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">TAGS (Comma separated)</label>
                                                <input type="text" className="form-control p-2" placeholder="e.g. Java, Security, Spring" value={formData.tags}
                                                    onChange={(e) => setFormData({...formData, tags: e.target.value})} />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === "code" && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold">BOILERPLATE / EXAMPLE CODE</label>
                                            <textarea className="form-control font-monospace p-3 bg-dark text-white" rows="10" 
                                                placeholder="public class MyComponent { ... }"
                                                value={formData.codeSnippet}
                                                onChange={(e) => setFormData({...formData, codeSnippet: e.target.value})}></textarea>
                                        </div>
                                    )}

                                    {activeTab === "media" && (
                                        <>
                                            <div className="mb-4">
                                                <label className="form-label small fw-bold">VIDEO TUTORIAL URL</label>
                                                <div className="input-group">
                                                    <span className="input-group-text"><i className="bi bi-youtube"></i></span>
                                                    <input type="url" className="form-control" placeholder="https://youtube.com/..." 
                                                        value={formData.videoUrl}
                                                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">DOCUMENTATION FILE</label>
                                                <div className="border border-2 border-dashed rounded-3 p-4 text-center">
                                                    <i className="bi bi-cloud-upload fs-2 text-primary"></i>
                                                    <p className="small text-muted mt-2">Click to upload PDF, Word or ZIP</p>
                                                    <input type="file" className="d-none" id="fileUpload" />
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => document.getElementById('fileUpload').click()}>Browse Files</button>
                                                </div>
                                            </div>
                                        </>
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
            
            {/* DELETE MODAL (Same as previous fix) */}
            {showDeleteModal && (
                <div className="modal show d-block" style={{ background: 'rgba(15, 23, 42, 0.8)', zIndex: 2050 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content text-center p-4">
                            <h5 className="fw-bold">Delete this?</h5>
                            <div className="d-flex gap-2 mt-3">
                                <button className="btn btn-danger w-100" onClick={() => { /* add executeDelete logic */ }}>Delete</button>
                                <button className="btn btn-light w-100" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;