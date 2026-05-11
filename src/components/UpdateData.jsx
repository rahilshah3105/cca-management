import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const UpdateData = () => {
    const { id } = useParams();
    const [data, setData] = useState({ name: '', Rs: '', id: '' });
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:3030/players/` + id)
            .then(res => setData(res.data))
            .catch(err => console.log(err));
    }, [id]);

    function handleSubmit(e) {
        e.preventDefault();
        axios.put('http://localhost:3030/players/' + id, data)
            .then(res => {
                console.log(res.data);
                alert("Data Updated Successfully...");
                navigate('/updateTable');
            })
            .catch(err => console.log(err));
    }

    return (
        <div className="w-screen h-screen flex justify-center items-center text-2xl">
            <form onSubmit={handleSubmit}>
                <div className="name m-5 p-5 text-center flex">
                    <input type="text" name='id' value={data.id} className='p-1 border border-black rounded ml-5 w-96' disabled />
                </div>
                <div className="name m-5 p-5 text-center flex">
                    <input type="text" name='name' value={data.name} placeholder='Enter Your Name' className='p-1 border border-black rounded ml-5 w-96' onChange={(e) => setData({ ...data, name: e.target.value })} />
                </div>
                <div className="rs m-5 p-5 text-center flex">
                    <input type="number" name='rs' value={data.Rs} placeholder='Enter Your Rs.' className='p-1 border border-black rounded ml-5 w-96' onChange={(e) => setData({ ...data, Rs: e.target.value })} />
                </div>
                <div className="btn m-5 p-5 text-center">
                    <button type="submit" className='p-1 border border-black rounded ml-10 w-32 hover:bg-blue-300'>Update</button>
                    <button type="reset" className='p-1 border border-black rounded ml-10 w-32 hover:bg-blue-300' onClick={() => setData({ ...data, name: '', Rs: '' })}>Reset</button>
                </div>
            </form>
        </div>
    );
}

export default UpdateData;
