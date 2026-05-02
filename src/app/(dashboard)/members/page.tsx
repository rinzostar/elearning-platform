'use client';

import { useState, useEffect } from 'react';
import styles from './members.module.css';
import { FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Professor';
  dob?: string;
};

const DUMMY_MEMBERS: Member[] = [
  { id: '1', name: 'Alice Smith', email: 'alice.smith@university.edu', role: 'Professor' },
  { id: '2', name: 'Bob Johnson', email: 'bob.j@student.edu', role: 'Student' },
  { id: '3', name: 'Charlie Davis', email: 'c.davis@student.edu', role: 'Student' }
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Student' | 'Professor'>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDob, setNewMemberDob] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Student' | 'Professor'>('Student');

  useEffect(() => {
    const saved = localStorage.getItem('lumina_members');
    if (saved) {
      setMembers(JSON.parse(saved));
    } else {
      setMembers(DUMMY_MEMBERS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lumina_members', JSON.stringify(members));
    }
  }, [members, isLoaded]);

  const filteredMembers = members.filter(m => activeTab === 'All' || m.role === activeTab);

  const openAddModal = () => {
    setEditMemberId(null);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberDob('');
    setNewMemberRole('Student');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditMemberId(member.id);
    setNewMemberName(member.name);
    setNewMemberEmail(member.email);
    setNewMemberDob(member.dob || '');
    setNewMemberRole(member.role);
    setIsModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberDob) return;

    const memberData: Member = {
      id: editMemberId || Date.now().toString(),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      dob: newMemberDob
    };

    if (editMemberId) {
      setMembers(prev => prev.map(m => m.id === editMemberId ? memberData : m));
    } else {
      setMembers(prev => [memberData, ...prev]);
    }
    
    setIsModalOpen(false);
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Members Management</h1>
          <p>Add and manage students and professors in your institution.</p>
        </div>
        <button className={styles.addBtn} onClick={openAddModal}>
          <FiPlus size={20} /> Add Member
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'All' ? styles.active : ''}`}
          onClick={() => setActiveTab('All')}
        >
          All Members ({members.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Student' ? styles.active : ''}`}
          onClick={() => setActiveTab('Student')}
        >
          Students ({members.filter(m => m.role === 'Student').length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Professor' ? styles.active : ''}`}
          onClick={() => setActiveTab('Professor')}
        >
          Professors ({members.filter(m => m.role === 'Professor').length})
        </button>
      </div>

      {filteredMembers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No {activeTab.toLowerCase()}s found. Add one to get started!</p>
        </div>
      ) : (
        <div className={styles.membersGrid}>
          {filteredMembers.map(member => (
            <div 
              key={member.id} 
              className={styles.memberCard}
              onClick={() => openEditModal(member)}
              style={{ cursor: 'pointer' }}
              title="Click to edit member"
            >
              <div className={styles.avatar}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>{member.name}</div>
                <div className={styles.memberEmail}>{member.email}</div>
                {member.dob && (
                  <div className={styles.memberEmail} style={{ marginTop: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Date of Birth: {(() => {
                      const [yyyy, mm, dd] = member.dob.split('-');
                      return `${dd}/${mm}/${yyyy}`;
                    })()}
                  </div>
                )}
                <div className={styles.roleBadge}>{member.role}</div>
              </div>
              <button 
                className={styles.removeBtn} 
                onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                title="Remove Member"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editMemberId ? 'Edit Member' : 'Add New Member'}</h2>
              <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMember}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="John Doe" 
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  placeholder="john@university.edu" 
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={newMemberDob}
                  onChange={e => setNewMemberDob(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Role</label>
                <select 
                  className={styles.select}
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as 'Student' | 'Professor')}
                >
                  <option value="Student">Student</option>
                  <option value="Professor">Professor</option>
                </select>
              </div>

              <button type="submit" className={styles.submitBtn}>
                {editMemberId ? 'Save Changes' : `Add ${newMemberRole}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
