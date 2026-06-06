import React, { useState, useMemo } from 'react';

// All users combined from both boards
const ALL_USERS = [
  // Leader board
  { id: 1, name: 'Hiii Florine', efficiency: 95, gpuHours: 95, type: 'leader' },
  { id: 2, name: 'Best Volleybal Player', efficiency: 88, gpuHours: 95, type: 'leader' },
  { id: 3, name: 'tallest Flo', efficiency: 92, gpuHours: 92, type: 'leader' },
  { id: 4, name: 'Quantum Quinton', efficiency: 90, gpuHours: 88, type: 'leader' },
  { id: 5, name: 'Data Dana', efficiency: 88, gpuHours: 86, type: 'leader' },
  { id: 6, name: 'Algorithm Aiden', efficiency: 86, gpuHours: 84, type: 'leader' },
  { id: 7, name: 'Pipeline Priya', efficiency: 84, gpuHours: 82, type: 'leader' },
  { id: 8, name: 'Kernel Ken', efficiency: 82, gpuHours: 80, type: 'leader' },
  { id: 9, name: 'Tensor Tessa', efficiency: 80, gpuHours: 78, type: 'leader' },
  { id: 10, name: 'Vector Vance', efficiency: 78, gpuHours: 76, type: 'leader' },
  // Loser board
  { id: 11, name: 'Aaron', efficiency: 70, gpuHours: 68, type: 'loser' },
  { id: 12, name: 'Ian', efficiency: 68, gpuHours: 65, type: 'loser' },
  { id: 13, name: 'Theo', efficiency: 66, gpuHours: 62, type: 'loser' },
  { id: 14, name: 'Laggy Lana', efficiency: 70, gpuHours: 68, type: 'loser' },
  { id: 15, name: 'Crash Carl', efficiency: 68, gpuHours: 65, type: 'loser' },
  { id: 16, name: 'Stuck Steve', efficiency: 66, gpuHours: 62, type: 'loser' },
  { id: 17, name: 'Frozen Fran', efficiency: 64, gpuHours: 60, type: 'loser' },
  { id: 18, name: 'Snail Nate', efficiency: 62, gpuHours: 58, type: 'loser' },
  { id: 19, name: 'Buffer Beth', efficiency: 60, gpuHours: 55, type: 'loser' },
  { id: 20, name: 'Timeout Tim', efficiency: 58, gpuHours: 52, type: 'loser' },
];

export default function UsersTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('efficiency-high');

  const filteredAndSortedUsers = useMemo(() => {
    let results = ALL_USERS.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort based on selection
    switch (sortBy) {
      case 'efficiency-high':
        results.sort((a, b) => b.efficiency - a.efficiency);
        break;
      case 'efficiency-low':
        results.sort((a, b) => a.efficiency - b.efficiency);
        break;
      case 'gpu-high':
        results.sort((a, b) => b.gpuHours - a.gpuHours);
        break;
      case 'gpu-low':
        results.sort((a, b) => a.gpuHours - b.gpuHours);
        break;
      case 'name-az':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return results;
  }, [searchTerm, sortBy]);

  return (
    <div className="users-container">
      <div className="controls-section">
        <div className="search-box">
          <label htmlFor="search">Search Users:</label>
          <input
            id="search"
            type="text"
            placeholder="Type name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <label htmlFor="sort">Sort By:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="efficiency-high">Efficiency: High to Low</option>
            <option value="efficiency-low">Efficiency: Low to High</option>
            <option value="gpu-high">GPU Hours: High to Low</option>
            <option value="gpu-low">GPU Hours: Low to High</option>
            <option value="name-az">Name: A to Z</option>
            <option value="name-za">Name: Z to A</option>
          </select>
        </div>

        <p className="result-count">
          Found {filteredAndSortedUsers.length} of {ALL_USERS.length} users
        </p>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Efficiency</th>
            <th>GPU Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedUsers.map((user, index) => (
            <tr key={user.id} className={`user-row ${user.type} ${index === 0 && user.type === 'leader' ? 'leader-first' : ''}`}>
              <td>{index + 1}</td>
              <td>{user.name}</td>
              <td>{user.efficiency}</td>
              <td>{user.gpuHours}</td>
              <td>
                <span className={`status-badge ${user.type}`}>
                  {user.type === 'leader' ? '⭐ Top Performer' : '📊 Active'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .users-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        .controls-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .search-box,
        .filter-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .search-box label,
        .filter-box label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .search-input,
        .filter-select {
          padding: 0.6rem 0.85rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease;
        }

        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .search-input {
          width: 250px;
        }

        .filter-select {
          min-width: 220px;
        }

        .result-count {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .users-table thead {
          background: #222;
          color: white;
        }

        .users-table th {
          padding: 1rem 1.25rem;
          text-align: left;
          font-weight: 700;
        }

        .users-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #eee;
        }

        .user-row {
          transition: background-color 0.2s ease;
        }

        .user-row:hover {
          background-color: #f9fafb;
        }

        .user-row.leader {
          background-color: #f0fdf4;
        }

        .user-row.loser {
          background-color: #fff7ed;
        }

        .status-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-badge.leader {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-badge.loser {
          background-color: #fed7aa;
          color: #92400e;
        }

        .leader-first td:first-child {
          position: relative;
          overflow: visible;
        }

        .leader-first td:first-child::before {
          content: '🏆 ';
          margin-right: 0.25rem;
        }

        .leader-first td:first-child::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          opacity: 0;
          box-shadow:
            -10px -10px 0 0 #facc15,
            10px -12px 0 0 #f97316,
            -8px 8px 0 0 #fde68a,
            12px 6px 0 0 #ef4444,
            0px 12px 0 0 #a855f7;
          transform: translate(-50%, -50%) scale(0.5);
          pointer-events: none;
        }

        .leader-first:hover td:first-child::after {
          opacity: 1;
          animation: confetti-burst 0.65s ease-out forwards;
        }

        @keyframes confetti-burst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.75);
          }
          40% {
            opacity: 1;
            transform: translate(8px, -8px) scale(1);
          }
          80% {
            transform: translate(14px, -18px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(18px, -28px) scale(0.8);
          }
        }

        @media (max-width: 768px) {
          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input,
          .filter-select {
            width: 100%;
          }

          .users-table th,
          .users-table td {
            padding: 0.75rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
