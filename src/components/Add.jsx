import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Add = () => {
    const [data, setdata] = useState({ name: '', Rs: '' });
    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();
        axios.post('http://localhost:3030/players', data)
            .then(res => {
                console.log(res.data);
                alert("Data Added Successfully...");
                navigate('/updateTable');
            }).catch(err => {
                // console.log(err);
                console.error(err);
            })
    }
    return (
        <>
            <div className="w-screen h-screen flex justify-center items-center text-2xl">
                <form action="" onSubmit={handleSubmit}>
                    <div className="name m-5 p-5 text-center flex">
                        {/* <label htmlFor="name" className='w-32'>Name: </label> */}
                        <input type="text" name='name' placeholder='Enter Your Name' className='p-1 border border-black rounded ml-5 w-96' onChange={(e) => setdata({ ...data, name: e.target.value })} required />
                    </div>
                    <div className="rs m-5 p-5 text-center flex">
                        {/* <label htmlFor="Rs" className='w-32'>Rs: </label> */}
                        <input type="number" name='rs' placeholder='Enter Your Rs.' className='p-1 border border-black rounded ml-5 w-96' onChange={(e) => setdata({ ...data, Rs: e.target.value })} required />
                    </div>
                    <div className="btn m-5 p-5 text-center">
                        <button type="submit" className='p-1 border border-black rounded ml-10 w-32 hover:bg-blue-300'>Submit</button>
                        <button type="reset" className='p-1 border border-black rounded ml-10 w-32 hover:bg-blue-300' onClick={() => setdata({ name: '', Rs: '' })}>Reset</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default Add
