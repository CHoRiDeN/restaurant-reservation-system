import React from 'react';
import {SignIn} from "@clerk/nextjs";

function SignInPage() {
    return (
        <div className="min-h-screen w-full flex justify-center items-center importer-bg">
            <SignIn></SignIn>
        </div>
    )
}

export default SignInPage;
