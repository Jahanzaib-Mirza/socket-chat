import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import GroupsList from './GroupsList';

// Connect to the backend server
const socket = io('http://localhost:4004/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzRkYWI3ZDUxZmZiYzk5MDcwMjNiODkiLCJpYXQiOjE3Mzc0NTk4MDQsImV4cCI6MTc0MDA1MTgwNH0.-DBRPOtzOrm_UJZBAgXnHhkMsYAWbSrugLTgIEQbYpo'); // Replace with your actual backend URL

function App() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [groups, setGroups] = useState([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true); // Start in loading state

  useEffect(() => {
    // Function to fetch groups
    const fetchGroups = () => {
      socket.emit('fetchGroups', page, limit);
    };

    // Fetch groups automatically on mount
    fetchGroups();

    // Listen for groups data from server
    socket.on('userGroups', (data) => {
      if (data.success) {
        setGroups(data.groups);
        setTotalGroups(data.totalGroups);
        setTotalPages(data.totalPages);
      } else {
        console.error('Failed to fetch groups:', data.message);
      }
      setLoading(false);
    });

    // Handle error messages from the server
    socket.on('error', (error) => {
      console.error('Error:', error.message);
      setLoading(false);
    });
    socket.on('newGroupMessage', (data) => {
      if (data.success) {
        console.log(data)
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group._id === data.groupId
              ? { 
                  ...group, 
                  lastMessage: data.message, 
                  unreadCount: Math.max(1, group.unreadCount) // Ensure it increments correctly by 1
                }
              : group
          )
        );
      }
    });
     
    return () => {
      socket.off('userGroups');
      socket.off('error');
    };
  }, [page, limit]); // Re-run when `page` or `limit` changes

  return (
    <div className="App">
      <h1>User Groups</h1>

      {loading ? <p>Loading groups...</p> : <GroupsList groups={groups} />}

      {/* Pagination */}
      <div>
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page <= 1 || loading}
        >
          Previous
        </button>
        <span> Page {page} </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
