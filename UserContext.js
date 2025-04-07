import React, { createContext, useState } from 'react';

// Create the context with a default value
export const UserContext = createContext({
  userEmail: null,
  setUserEmail: () => {},
});

export const UserProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);

  return (
    <UserContext.Provider value={{ userEmail, setUserEmail }}>
      {children}
    </UserContext.Provider>
  );
};
