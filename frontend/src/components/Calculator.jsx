import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { User, Phone, Calendar, Trash2, Printer, Share2, Download, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from './Navbar';

const Calculator = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // UPDATED: Default row now uses 'Indian-MT'
    const [rows, setRows] = useState([
        { id: 1, qty: '', length: '', width: '', thickness: '', teakType: 'Indian-MT', rate: '' }
    ]);
    const [gstPercent, setGstPercent] = useState(18);
    const [makingCost, setMakingCost] = useState(0);
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

    // UPDATED: New Teak Options
    const TEAK_TYPES = ['Indian-MT', 'Indian-GMT', 'Indian-BT', 'African-MT', 'African-GMT', 'African-BT', '- - -'];

    useEffect(() => {
        if (id) {
            setIsLoading(true);
            axios.get(`http://localhost:5000/api/estimates/${id}`)
                .then(res => {
                    const data = res.data;
                    setCustomerName(data.customerName);
                    setPhoneNumber(data.phoneNumber);
                    setInvoiceDate(data.invoiceDate);
                    setRows(data.rows.length ? data.rows : [{ id: 1, qty: '', length: '', width: '', thickness: '', teakType: 'Indian-MT', rate: '' }]);
                    setGstPercent(data.gstPercent);
                    setMakingCost(data.makingCost);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    toast.error("Could not load estimate.");
                    navigate('/');
                });
        }
    }, [id, navigate]);

    const calculateRow = useCallback((row) => {
        const qty = parseFloat(row.qty) || 0;
        const length = parseFloat(row.length) || 0;
        const width = parseFloat(row.width) || 0;
        const thickness = parseFloat(row.thickness) || 0;
        const rate = parseFloat(row.rate) || 0;

        const cft = (qty * length * width * thickness) / 144;
        const cost = cft * rate;
        return {
            cft: parseFloat(cft.toFixed(4)),
            cost: parseFloat(cost.toFixed(2))
        };
    }, []);

    const totals = rows.reduce((acc, row) => {
        const { cft, cost } = calculateRow(row);
        return {
            totalQty: acc.totalQty + (parseFloat(row.qty) || 0),
            totalCFT: acc.totalCFT + cft,
            subTotal: acc.subTotal + cost
        };
    }, { totalQty: 0, totalCFT: 0, subTotal: 0 });

    const gstAmount = (totals.subTotal * gstPercent) / 100;
    const grandTotal = totals.subTotal + gstAmount + parseFloat(makingCost || 0);

    const updateRow = (id, field, value) => {
        setRows(prevRows => {
            const updatedRows = prevRows.map(row => (row.id === id ? { ...row, [field]: value } : row));
            const lastRow = updatedRows[updatedRows.length - 1];
            if (lastRow.id === id) {
                const hasData = ['length', 'width', 'thickness', 'rate'].some(key => parseFloat(lastRow[key]) > 0);
                if (hasData) {
                    const newId = Math.max(...updatedRows.map(r => r.id)) + 1;
                    // UPDATED: Auto-added rows use 'Indian-MT'
                    return [...updatedRows, { id: newId, qty: '', length: '', width: '', thickness: '', teakType: 'Indian-MT', rate: '' }];
                }
            }
            return updatedRows;
        });
    };

    const removeRow = (id) => {
        if (rows.length === 1) {
            setRows([{ id: 1, qty: '', length: '', width: '', thickness: '', teakType: 'Indian-MT', rate: '' }]);
        } else {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const clearAll = () => {
        if (window.confirm('Clear all data?')) {
            setRows([{ id: 1, qty: '', length: '', width: '', thickness: '', teakType: 'Indian-MT', rate: '' }]);
            setMakingCost(0); setGstPercent(18); setCustomerName(''); setPhoneNumber('');
            setInvoiceDate(new Date().toISOString().split('T')[0]);
            if(id) navigate('/create'); 
        }
    };

    const handleSave = () => {
        setIsLoading(true);
        const estimateData = { customerName, phoneNumber, invoiceDate, rows, gstPercent, makingCost, grandTotal };
        
        const request = id 
            ? axios.put(`http://localhost:5000/api/estimates/update/${id}`, estimateData)
            : axios.post('http://localhost:5000/api/estimates/add', estimateData);

        request
            .then(() => {
                toast.success(id ? "Estimate Updated!" : "Estimate Saved!");
                navigate('/');
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to save.");
                setIsLoading(false);
            });
    };

    const handlePrint = () => window.print();
    
    const getPdfOptions = () => ({
        margin: [2, 2, 2, 2],
        filename: `Shree_Ravi_Timber_${customerName || 'Estimate'}_${invoiceDate}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 3, 
            useCORS: true, 
            scrollY: 0,
            letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    });

    const handleDownloadPDF = () => {
        const element = document.getElementById('printable-area');
        html2pdf().set(getPdfOptions()).from(element).save();
    };

    const handleWhatsApp = () => {
        if (!phoneNumber) return toast.error("Please enter phone number.");
        const element = document.getElementById('printable-area');
        
        toast.loading("Preparing WhatsApp PDF...", { id: 'wa-toast' });
        html2pdf().set(getPdfOptions()).from(element).save().then(() => {
            toast.dismiss('wa-toast');
            let cleanNumber = phoneNumber.replace(/\D/g, '');
            if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
            const message = encodeURIComponent(`*Shree Ravi Timber Estimate*\n\nHello ${customerName},\nPlease find attached estimate dated ${invoiceDate}.\n\nGrand Total: ₹ ${grandTotal.toFixed(2)}`);
            window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
        });
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-900"></div></div>;

    return (
        <div className="max-w-5xl mx-auto p-4 my-8">
             <button onClick={() => navigate('/')} className="mb-4 flex items-center text-gray-600 hover:text-black font-bold transition">
                <ArrowLeft size={20} className="mr-2"/> Back to Dashboard
            </button>

            <div id="printable-area" className="bg-white shadow-xl rounded-lg pb-4">
                <Navbar onClear={clearAll} />

                <div className="bg-gray-800 p-4 text-white grid grid-cols-1 md:grid-cols-3 gap-4 print:bg-white print:text-black">
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Customer Name</label>
                        <div className="flex items-center bg-gray-700 rounded border border-gray-600 focus-within:border-yellow-500 transition print:bg-white print:border-gray-300">
                            <User size={18} className="ml-2 text-gray-400" />
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional Name" className="bg-transparent p-2 w-full outline-none font-semibold placeholder-gray-500 text-white print:text-black" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Phone Number</label>
                        <div className="flex items-center bg-gray-700 rounded border border-gray-600 focus-within:border-yellow-500 transition print:bg-white print:border-gray-300">
                            <Phone size={18} className="ml-2 text-gray-400" />
                            <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Optional Number" className="bg-transparent p-2 w-full outline-none font-semibold placeholder-gray-500 text-white print:text-black" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1 uppercase">Date</label>
                        <div className="flex items-center bg-gray-700 rounded border border-gray-600 focus-within:border-yellow-500 transition print:bg-white print:border-gray-300">
                            <Calendar size={18} className="ml-2 text-gray-400" />
                            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-transparent p-2 w-full outline-none font-semibold text-white print:text-black pretty-date" />
                        </div>
                    </div>
                </div>

                <div className="p-4 overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 text-sm font-extrabold uppercase border-b-2 border-gray-300">
                                <th className="p-3 w-12">#</th>
                                <th className="p-3 w-24">Qty</th>
                                <th className="p-3 w-28">Length <span className="text-[10px]">(ft)</span></th>
                                <th className="p-3 w-40">Size <span className="text-[10px]">(w x t) (in)</span></th>
                                <th className="p-3 w-40 bg-yellow-50 border-x border-yellow-100">Teak Type</th>
                                <th className="p-3 w-32 bg-blue-50 border-x border-blue-100">CFT <span className="text-[10px]">(calc)</span></th>
                                <th className="p-3 w-32">Rate / CFT <span className="text-[10px]">(₹)</span></th>
                                <th className="p-3 w-36 bg-green-50 border-l border-green-100">Cost <span className="text-[10px]">(₹)</span></th>
                                <th className="p-3 w-12 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rows.map((row, index) => {
                                const { cft, cost } = calculateRow(row);
                                return (
                                    <tr key={row.id} className="hover:bg-gray-50 transition">
                                        <td className="p-3 text-center font-bold text-gray-500">{index + 1}</td>
                                        <td className="p-2"><input type="number" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', e.target.value)} className="w-full p-2 border border-gray-300 bg-white rounded text-center font-bold focus:border-gray-900 outline-none leading-normal" /></td>
                                        <td className="p-2"><input type="number" value={row.length} onChange={(e) => updateRow(row.id, 'length', e.target.value)} className="w-full p-2 border border-gray-300 bg-white rounded text-center font-bold focus:border-gray-900 outline-none leading-normal" /></td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-center border border-gray-300 bg-white rounded focus-within:border-gray-900 transition mx-auto w-[90px]">
                                                <input 
                                                    type="number" 
                                                    value={row.width} 
                                                    onChange={(e) => updateRow(row.id, 'width', e.target.value)} 
                                                    className="w-8 text-center font-extrabold outline-none bg-transparent leading-normal px-0 py-2 m-0" 
                                                    placeholder="W" 
                                                />
                                                <span className="text-gray-400 font-extrabold text-sm mx-0.5 pb-[2px]">x</span>
                                                <input 
                                                    type="number" 
                                                    value={row.thickness} 
                                                    onChange={(e) => updateRow(row.id, 'thickness', e.target.value)} 
                                                    className="w-8 text-center font-extrabold outline-none bg-transparent leading-normal px-0 py-2 m-0" 
                                                    placeholder="T" 
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 bg-yellow-50/50">
                                            <select value={row.teakType} onChange={(e) => updateRow(row.id, 'teakType', e.target.value)} className="w-full p-2 border border-yellow-200 bg-white rounded text-center font-bold focus:border-yellow-500 outline-none cursor-pointer leading-normal">
                                                {TEAK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-lg bg-blue-50/50 leading-normal">{cft.toFixed(4)}</td>
                                        <td className="p-2"><input type="number" value={row.rate} onChange={(e) => updateRow(row.id, 'rate', e.target.value)} className="w-full p-2 border border-gray-300 bg-white rounded text-center font-bold focus:border-gray-900 outline-none leading-normal" /></td>
                                        <td className="p-3 text-right font-mono font-bold text-lg bg-green-50/50 text-gray-800 leading-normal">₹ {cost.toFixed(2)}</td>
                                        <td className="p-2 text-center print:hidden">
                                            <button onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-extrabold text-gray-800 border-t-2 border-gray-300">
                            <tr>
                                <td className="p-3 text-center">Total</td>
                                <td className="p-3 text-center bg-yellow-100 border border-yellow-200 text-xl leading-normal">{totals.totalQty}</td>
                                <td colSpan="3"></td>
                                <td className="p-3 text-center bg-blue-100 border border-blue-200 font-mono text-xl leading-normal">{totals.totalCFT.toFixed(4)}</td>
                                <td></td>
                                <td className="p-3 text-right bg-green-100 border border-green-200 font-mono text-xl leading-normal">₹ {totals.subTotal.toFixed(2)}</td>
                                <td className="print:hidden"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap justify-end gap-4 items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center bg-gray-100 p-2 rounded border border-gray-200">
                            <span className="text-xs font-bold text-gray-500 uppercase mr-2">Sub Total</span>
                            <span className="font-mono font-bold text-lg leading-normal">₹ {totals.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center bg-gray-100 p-2 rounded border border-gray-200">
                             <span className="text-xs font-bold text-gray-500 uppercase mr-2">GST</span>
                            <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                                <input type="number" value={gstPercent} onChange={e => setGstPercent(parseFloat(e.target.value)||0)} className="w-10 p-1 text-center font-bold outline-none leading-normal" />
                                <span className="bg-gray-100 p-1 text-gray-500 text-sm border-l border-gray-300">%</span>
                            </div>
                            <span className="font-mono font-bold text-lg ml-2 leading-normal">₹ {gstAmount.toFixed(2)}</span>
                        </div>
                         <div className="flex items-center bg-gray-100 p-2 rounded border border-gray-200">
                             <span className="text-xs font-bold text-gray-500 uppercase mr-2">Making</span>
                            <div className="flex items-center bg-white border border-gray-300 rounded overflow-hidden px-1">
                                <span className="text-gray-500 text-sm">₹</span>
                                <input type="number" value={makingCost} onChange={e => setMakingCost(parseFloat(e.target.value)||0)} className="w-20 p-1 text-right font-bold outline-none leading-normal" />
                            </div>
                        </div>
                        <div className="flex items-center bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200">
                             <span className="text-sm font-extrabold text-yellow-800 uppercase mr-3">Grand Total</span>
                            <span className="font-mono font-extrabold text-2xl text-gray-900 leading-normal">₹ {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 print:hidden">
                 <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition order-1 md:order-none flex-grow md:flex-grow-0 justify-center">
                    <Save size={20} /> {id ? "Update Estimate" : "Save Profile"}
                </button>

                <div className="flex gap-3 flex-grow md:flex-grow-0">
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-lg font-bold shadow transition flex-1">
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-bold shadow transition flex-1">
                        <Share2 size={18} /> WhatsApp
                    </button>
                </div>
                <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition flex-grow md:flex-grow-0 order-2 md:order-none">
                    <Download size={20} /> Direct Download PDF
                </button>
            </div>
        </div>
    );
};

export default Calculator;