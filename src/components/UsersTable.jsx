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
          {filteredAndSortedUsers.map((user, index) => {
            const isFirstLeader = index === 0 && user.type === 'leader';
            return (
              <tr key={user.id} className={`user-row ${user.type} ${isFirstLeader ? 'first-place' : ''}`}>
                <td>
                  {isFirstLeader ? (
                    <div className="trophy-wrap">
                      🏆
                      <div className="confetti"></div>
                      <div className="confetti"></div>
                      <div className="confetti"></div>
                      <div className="confetti"></div>
                      <div className="confetti"></div>
                    </div>
                  ) : (
                    index + 1
                  )}
                </td>
                <td>{user.name}</td>
                <td>{user.efficiency}</td>
                <td>{user.gpuHours}</td>
                <td>
                  <span className={`status-badge ${user.type}`}>
                    {user.type === 'leader' ? '⭐ Top Performer' : '📊 Active'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .users-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0;
        }

        .controls-section {
          background: #061318;
          border: 1px solid rgba(83, 213, 253, 0.22);
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 12px 32px rgba(2, 12, 18, 0.4);
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
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #d5ad4d;
        }

        .search-input,
        .filter-select {
          background: rgba(255, 255, 255, 0.03);
          color: #e5f7ff;
          padding: 0.6rem 0.85rem;
          border: 1px solid rgba(83, 213, 253, 0.24);
          border-radius: 12px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .search-input::placeholder {
          color: #7a8ba3;
        }

        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #53d5fd;
          box-shadow: 0 0 0 3px rgba(83, 213, 253, 0.14);
          background: rgba(255, 255, 255, 0.06);
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
          color: #b6eeff;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: #061318;
          color: #e8f7ff;
          border: 1px solid rgba(83, 213, 253, 0.18);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 42px rgba(2, 12, 18, 0.45);
        }

        .users-table thead {
          background: rgba(83, 213, 253, 0.08);
          color: #53d5fd;
        }

        .users-table th {
          font-family: 'Orbitron', sans-serif;
          padding: 1rem 1.25rem;
          text-align: left;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-size: 0.78rem;
          font-weight: 700;
          border-bottom: 1px solid rgba(83, 213, 253, 0.18);
        }

        .users-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(83, 213, 253, 0.1);
        }

        .user-row {
          transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }

        .user-row:hover {
          transform: translateY(-2px);
        }

        .user-row.leader {
          background-color: rgba(83, 213, 253, 0.05);
        }

        .user-row.loser {
          background-color: rgba(213, 173, 77, 0.07);
        }

        .user-row.leader:hover {
          background-color: rgba(83, 213, 253, 0.1);
          box-shadow: inset 3px 0 0 #53d5fd;
        }

        .user-row.loser:hover {
          background-color: rgba(213, 173, 77, 0.12);
          box-shadow: inset 3px 0 0 #d5ad4d;
        }

        .status-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid transparent;
        }

        .status-badge.leader {
          background-color: rgba(83, 213, 253, 0.12);
          color: #b6eeff;
          border-color: rgba(83, 213, 253, 0.25);
        }

        .status-badge.loser {
          background-color: rgba(213, 173, 77, 0.14);
          color: #ffebaf;
          border-color: rgba(213, 173, 77, 0.28);
        }

        .trophy-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-right: 0.2rem;
          font-size: 1.1rem;
          overflow: visible;
        }

        .confetti {
          position: absolute;
          left: 50%;
          top: 0;
          width: 6px;
          height: 6px;
          background: #d5ad4d;
          opacity: 0;
          border-radius: 50%;
          pointer-events: none;
        }

        .first-place:hover .confetti {
          animation: confetti-pop 0.6s ease-out forwards;
        }

        .first-place:hover .confetti:nth-child(2) {
          animation-delay: 0.02s;
        }

        .first-place:hover .confetti:nth-child(3) {
          animation-delay: 0.08s;
        }

        .first-place:hover .confetti:nth-child(4) {
          animation-delay: 0.14s;
        }

        .first-place:hover .confetti:nth-child(5) {
          animation-delay: 0.2s;
        }

        .first-place:hover .confetti:nth-child(6) {
          animation-delay: 0.26s;
        }

        @keyframes confetti-pop {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
            box-shadow:
              10px -10px red,
              -10px -15px lime,
              20px -20px cyan,
              -20px -25px orange,
              0 -30px magenta;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -36px) scale(0.5);
            box-shadow:
              20px -30px red,
              -20px -40px lime,
              35px -45px cyan,
              -35px -50px orange,
              0 -60px magenta;
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

          .users-container {
            overflow-x: auto;
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
