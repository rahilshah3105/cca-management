import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const UpdatabelTable = () => {
    const [column, setColumn] = useState([]);
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:3030/players')
            .then(res => {
                if (res.data.length > 0) {
                    setColumn(Object.keys(res.data[0]));
                    setData(res.data);
                }
            })
            .catch(err => console.log(err));
    }, []);

    function handleDelete(id) {
        const conf = window.confirm("Do you want to delete the data?");
        if (conf) {
            axios.delete(`http://localhost:3030/players/${id}`)
                .then(res => {
                    alert("Data Deleted Successfully...");
                    setData(data.filter(item => item.id !== id));
                })
                .catch(err => console.log(err));
        }
    }

    return (
        <>
            <div className="flex flex-col p-5">
                <Link to={"/add"} className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2'>Add +</Link>
                <div className='w-2/3 m-auto mt-2 border border-black rounded-md overflow-y-auto custom-scrollbar' style={{ maxHeight: '610px' }}>
                    <table className='table-auto w-full'>
                        <thead className='text-xl sticky'>
                            <tr>
                                {column.map((c, i) => (
                                    <th className='pr-20 p-1 text-2xl underline capitalize sticky top-0 bg-white' key={i}>{c}</th>
                                ))}
                                <th className='underline p-1 text-2xl sticky top-0 bg-white'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, i) => (
                                <tr key={i}>
                                    {column.map((col, j) => (
                                        <td className='pr-20 p-1 text-xl capitalize text-center' key={j}>{d[col]}</td>
                                    ))}
                                    <td className='text-center text-lg py-2'>
                                        <Link to={`/update/${d.id}`} className='bg-blue-500 p-1.5 text-white rounded m-1.5'>Update</Link>
                                        <button onClick={() => handleDelete(d.id)} className='bg-red-500 p-1.5 text-white rounded m-1.5'>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Link to={"/"}><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2 flex mt-2'>Home</button></Link>
        </>
    );
};

export default UpdatabelTable;
