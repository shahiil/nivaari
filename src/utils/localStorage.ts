/**
 * Utility functions for managing user data in localStorage
 */

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
}

/**
 * Get all users from localStorage
 */
export const getAllUsers = (): UserData[] => {
  try {
    return JSON.parse(localStorage.getItem('users') || '[]');
  } catch (error) {
    console.error('Error getting users from localStorage:', error);
    return [];
  }
};

/**
 * Get a specific user by UID
 */
export const getUserByUid = (uid: string): UserData | null => {
  const users = getAllUsers();
  return users.find(user => user.uid === uid) || null;
};

/**
 * Save a user to localStorage
 */
export const saveUser = (userData: UserData): void => {
  try {
    const users = getAllUsers();
    const existingIndex = users.findIndex(user => user.uid === userData.uid);
    
    if (existingIndex >= 0) {
      // Update existing user
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      // Add new user
      users.push(userData);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    console.log('User saved successfully:', userData);
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

/**
 * Update a user's last login time
 */
export const updateUserLastLogin = (uid: string): void => {
  try {
    const users = getAllUsers();
    const existingIndex = users.findIndex(user => user.uid === uid);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { 
        ...users[existingIndex], 
        lastLogin: new Date().toISOString() 
      };
      localStorage.setItem('users', JSON.stringify(users));
      console.log('User last login updated successfully for UID:', uid);
    }
  } catch (error) {
    console.error('Error updating user last login:', error);
  }
};

/**
 * Remove a user from localStorage
 */
export const removeUser = (uid: string): void => {
  try {
    const users = getAllUsers();
    const filteredUsers = users.filter(user => user.uid !== uid);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    console.log('User removed successfully for UID:', uid);
  } catch (error) {
    console.error('Error removing user from localStorage:', error);
  }
};