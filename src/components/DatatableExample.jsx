import { useEffect, useState } from 'react';
import '../App.css';
import DataTable from 'react-data-table-component';
import { Link } from 'react-router-dom';

const DatatableExample = () => {
  const columns = [
    {
      name: 'Name',
      selector: (row) => row.name,
      sortable: true
    },
    {
      name: 'Rs',
      selector: (row) => row.Rs,
      sortable: true
    }
  ];

  const [records, setRecords] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  useEffect(() => {
    fetch('data.json')
      .then(res => res.json())
      .then(data => {
        setRecords(data.players);
        setOriginalData(data.players);
      });
  }, []);

  const handleSearch = (event) => {
    const searchText = event.target.value.toLowerCase();
    const filteredData = originalData.filter((item) =>
      item.name.toLowerCase().includes(searchText)
    );
    setRecords(filteredData);
  };

  return (
    <>
      <div className='max-w-3xl mx-auto p-6'>
        <h1 className='text-3xl text-center underline m-1 mb-5'>Shree Chintamani Cricket Association</h1>
        <input
          type="text"
          onChange={handleSearch}
          placeholder='Search Player Name'
          className='w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none focus:border-blue-500'
        />
        <div className="table min-w-full bg-white rounded-lg shadow overflow-hidden">
          <DataTable
            columns={columns}
            data={records}
            selectableRows
            fixedHeader
            pagination
            highlightOnHover
          />
        </div>
      </div>
      <Link to={"/"}><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2 flex mt-1'>Home</button></Link>
    </>
  )
}

export default DatatableExample
