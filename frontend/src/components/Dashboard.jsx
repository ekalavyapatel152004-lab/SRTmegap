import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, Trash2, Edit2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from './Navbar';

const Dashboard = () => {
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch saved data on load
    useEffect(() => {
        fetchEstimates();
    }, []);

    const fetchEstimates = () => {
        axios.get('http://localhost:5000/api/estimates')
            .then(res => {
                setEstimates(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                toast.error("Failed to load estimates.");
            });
    }

    const deleteEstimate = (id, e) => {
        e.preventDefault(); // Stop the link click
        if(window.confirm("Are you sure you want to delete this estimate permanently?")) {
            axios.delete(`http://localhost:5000/api/estimates/${id}`)
                .then(() => {
                    toast.success("Estimate deleted successfully.");
                    fetchEstimates(); // Reload list
                })
                .catch(() => toast.error("Failed to delete."));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 mt-8">
            {/* Reusing the dark navbar style for dashboard header */}
            <div className="bg-gray-900 text-white p-6 rounded-t-lg flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-400">Manage your saved estimates</p>
                 </div>
                <Link to="/create" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg">
                    <Plus size={24} /> Create New Estimate
                </Link>
            </div>
            
            <div className="bg-white shadow-xl rounded-b-lg p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                        <Loader2 className="animate-spin mr-2" /> Loading...
                    </div>
                ) : estimates.length === 0 ? (
                     <div className="text-center text-gray-500 py-20">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-xl">No saved estimates yet.</p>
                        <p>Click "Create New Estimate" to get started.</p>
                     </div>
                ) : (
                    <div className="grid gap-4">
                        {estimates.map(est => (
                            // The whole block is a link to edit
                            <Link to={`/edit/${est._id}`} key={est._id} className="group block bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-300 cursor-pointer relative overflow-hidden">
                                {/* Colored bar on left */}
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>
                                <div className="flex justify-between items-center pl-4">
                                    <div className="flex items-center gap-4">
                                         <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-800 group-hover:text-blue-700 transition">{est.customerName || 'Unnamed Customer'}</h3>
                                            <div className="text-sm text-gray-500 flex gap-3 mt-1">
                                                <span>{new Date(est.invoiceDate).toLocaleDateString()}</span>
                                                 {est.phoneNumber && <span>• 📞 {est.phoneNumber}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                         <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Grand Total</p>
                                            <p className="text-2xl font-extrabold text-gray-900">₹ {est.grandTotal?.toFixed(2)}</p>
                                         </div>
                                         
                                         <div className="flex gap-2 pl-4 border-l">
                                              {/* Edit Icon (Visual only, whole block is link) */}
                                            <div className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition">
                                                <Edit2 size={20} />
                                            </div>
                                             {/* Delete Button */}
                                            <button onClick={(e) => deleteEstimate(est._id, e)} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100 transition z-10 relative">
                                                <Trash2 size={20} />
                                            </button>
                                         </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;