import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator as CalcIcon, RefreshCcw } from 'lucide-react';

const Navbar = ({ onClear }) => {
    return (
        <div className="bg-gray-900 text-white p-4 rounded-t-lg flex justify-between items-center">
             {/* Link back to dashboard */}
            <Link to="/" className="flex items-center gap-2 hover:text-gray-300 transition">
                <CalcIcon className="text-yellow-500" size={28} />
                <h1 className="text-2xl font-bold">
                    Shree Ravi Timber <span className="font-light opacity-70 ml-1">Estimate</span>
                </h1>
            </Link>
            {onClear && (
                <button onClick={onClear} className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded font-bold transition text-sm">
                    <RefreshCcw size={16} /> Clear All
                </button>
            )}
        </div>
    );
};

export default Navbar;