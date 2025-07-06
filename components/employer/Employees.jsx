import React, { useState, useEffect } from 'react';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    hourlyRate: '',
    walletAddress: ''
  });

  useEffect(() => {
    // In a real app, you would fetch employees from your Solana program
    const fetchEmployees = async () => {
      try {
        // Mock data for demonstration
        const mockEmployees = [
          {
            id: 1,
            name: 'John Doe',
            position: 'Software Developer',
            hourlyRate: 25,
            walletAddress: '8ZU7Zs3k56UaKnELwdQXrKKmL9ZXyA3cHLQrXAP7pMjq',
            isActive: true,
            totalHoursWorked: 120,
            totalPaid: 3000
          },
          {
            id: 2,
            name: 'Jane Smith',
            position: 'UI/UX Designer',
            hourlyRate: 22,
            walletAddress: '6ZvxMC9U2MotLEQaCiZ3y2AKAjHpwVHBX3VBveLfUYw9',
            isActive: true,
            totalHoursWorked: 100,
            totalPaid: 2200
          },
          {
            id: 3,
            name: 'Mike Johnson',
            position: 'Project Manager',
            hourlyRate: 30,
            walletAddress: '4tQKBkLwLFVUyQZCWU5hbJoJyWGMFxXD7nUCpSuAUZHb',
            isActive: true,
            totalHoursWorked: 80,
            totalPaid: 2400
          },
          {
            id: 4,
            name: 'Sarah Williams',
            position: 'QA Engineer',
            hourlyRate: 20,
            walletAddress: '2xCgLR9PAwQVzKgbAz9V5QLJyU8PkbZYyAAZNVfRUxNm',
            isActive: false,
            totalHoursWorked: 60,
            totalPaid: 1200
          },
          {
            id: 5,
            name: 'David Brown',
            position: 'DevOps Engineer',
            hourlyRate: 28,
            walletAddress: '9YqPgzHxLCrjQAHJvGSJFwkwRGQDUvdXMDF5qwQsVfPK',
            isActive: false,
            totalHoursWorked: 40,
            totalPaid: 1120
          }
        ];
        
        setEmployees(mockEmployees);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: value
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    try {
      // In a real app, you would call your Solana program to register an employee
      const newId = employees.length + 1;
      const employeeToAdd = {
        id: newId,
        name: newEmployee.name,
        position: newEmployee.position,
        hourlyRate: parseFloat(newEmployee.hourlyRate),
        walletAddress: newEmployee.walletAddress,
        isActive: true,
        totalHoursWorked: 0,
        totalPaid: 0
      };
      
      setEmployees([...employees, employeeToAdd]);
      setNewEmployee({
        name: '',
        position: '',
        hourlyRate: '',
        walletAddress: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const toggleEmployeeStatus = async (id) => {
    try {
      // In a real app, you would call your Solana program to update an employee
      const updatedEmployees = employees.map(employee => {
        if (employee.id === id) {
          return {
            ...employee,
            isActive: !employee.isActive
          };
        }
        return employee;
      });
      
      setEmployees(updatedEmployees);
    } catch (error) {
      console.error('Error toggling employee status:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h2>Manage Employees</h2>
        <button 
          className="add-employee-button"
          onClick={() => setShowAddModal(true)}
        >
          Add Employee
        </button>
      </div>
      
      {employees.length === 0 ? (
        <div className="no-employees">
          <p>No employees found.</p>
        </div>
      ) : (
        <div className="employees-list">
          <div className="employees-table">
            <div className="table-header">
              <div className="header-cell">Name</div>
              <div className="header-cell">Position</div>
              <div className="header-cell">Hourly Rate</div>
              <div className="header-cell">Wallet Address</div>
              <div className="header-cell">Hours Worked</div>
              <div className="header-cell">Total Paid</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
            </div>
            
            <div className="table-body">
              {employees.map(employee => (
                <div key={employee.id} className="table-row">
                  <div className="cell">{employee.name}</div>
                  <div className="cell">{employee.position}</div>
                  <div className="cell">${employee.hourlyRate}/hr</div>
                  <div className="cell wallet-address">
                    {`${employee.walletAddress.substring(0, 4)}...${employee.walletAddress.substring(employee.walletAddress.length - 4)}`}
                  </div>
                  <div className="cell">{employee.totalHoursWorked}</div>
                  <div className="cell">${employee.totalPaid}</div>
                  <div className="cell">
                    <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="cell actions">
                    <button 
                      className="status-toggle-button"
                      onClick={() => toggleEmployeeStatus(employee.id)}
                    >
                      {employee.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Employee</h3>
              <button 
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={newEmployee.position}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="hourlyRate">Hourly Rate ($)</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  min="1"
                  step="0.01"
                  value={newEmployee.hourlyRate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="walletAddress">Wallet Address</label>
                <input
                  type="text"
                  id="walletAddress"
                  name="walletAddress"
                  value={newEmployee.walletAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;