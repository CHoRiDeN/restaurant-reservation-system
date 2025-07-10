import React from 'react';

function AuthLayout({children}:  {children: React.ReactNode}) {
    return (
        <main className="auth">
            {children}
        </main>
    )
}

export default AuthLayout;
