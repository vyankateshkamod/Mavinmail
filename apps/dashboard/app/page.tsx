"use client";
import Link from 'next/link';
import { useRouter } from "next/navigation";

// export default function Home() {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen py-2">
//       <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
//         <h1 className="text-6xl font-bold">
//           Welcome to your AI Email Assistant
//         </h1>

//         <p className="mt-3 text-2xl">
//           Get started by signing up or logging in.
//         </p>

//         <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
//           <Link href="/auth/signup" className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600">
//             <h3 className="text-2xl font-bold">Sign Up &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Create a new account to get started.
//             </p>
//           </Link>

//           <Link href="/auth/login" className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600">
//             <h3 className="text-2xl font-bold">Login &rarr;</h3>
//             <p className="mt-4 text-xl">
//               Already have an account? Log in here.
//             </p>
//           </Link>
//         </div>
//       </main>
//     </div>
//   );
// }

//-------------------------------------------------------------------------


// import Head from 'next/head';
// import { useState } from 'react';

// // --- SVG Icons (for single-file convenience) ---

// const GoogleIcon = () => (
//   <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
//     <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
//     <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
//     <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.356-11.01-7.928l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
//     <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.417 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
//   </svg>
// );

// const OutlookIcon = () => (
//     <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
//         <path d="M1.5,18.16V5.84A2.34,2.34,0,0,1,3.84,3.5H14.28a1,1,0,0,1,.7.28l5.42,5.14a1,1,0,0,1,.31.72V18.16A2.34,2.34,0,0,1,18.34,20.5H3.84A2.34,2.34,0,0,1,1.5,18.16Z" fill="#0072C6"></path>
//         <path d="M14.6,3.5l5.8,5.5V5.84A2.34,2.34,0,0,0,18.34,3.5Z" fill="#00599D"></path>
//         <path d="M9.13,10.28a1,1,0,0,1,1.17-.1l5.44,3.4a.5.5,0,0,1,0,.84l-5.44,3.4a1,1,0,0,1-1.55-.84V11A1,1,0,0,1,9.13,10.28Z" fill="#FFFFFF"></path>
//         <path d="M4,7.5A1.5,1.5,0,0,1,5.5,6h4A1.5,1.5,0,0,1,11,7.5v9A1.5,1.5,0,0,1,9.5,18h-4A1.5,1.5,0,0,1,4,16.5Z" fill="#2D9BDB"></path>
//         <path d="M4,7.5A1.5,1.5,0,0,1,5.5,6h4A1.5,1.5,0,0,1,11,7.5v.5H5.5A1.5,1.5,0,0,0,4,9.5Z" fill="#FFFFFF" opacity="0.5"></path>
//     </svg>
// );

// const PlusIcon = () => (
//     <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
// );

// const MinusIcon = () => (
//     <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
// );


// // --- FAQ Item Component ---
// const FaqItem = ({ question, answer }) => {
//     const [isOpen, setIsOpen] = useState(false);

//     return (
//         <div className="border-b border-gray-200 py-6">
//             <button
//                 className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800"
//                 onClick={() => setIsOpen(!isOpen)}
//             >
//                 <span>{question}</span>
//                 {isOpen ? <MinusIcon /> : <PlusIcon />}
//             </button>
//             {isOpen && (
//                 <div className="mt-4 text-gray-600">
//                     <p>{answer}</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// // --- Main Landing Page Component ---
// export default function Home() {

//    const router = useRouter();

//     const faqData = [
//         {
//             question: "How does Meeco organize my inbox?",
//             answer: "Meeco uses advanced AI to automatically categorize, prioritize, and label your emails based on content and sender. This helps you focus on what's important and reach inbox zero faster than ever."
//         },
//         {
//             question: "Can Meeco write replies for me?",
//             answer: "Yes! Meeco's AI can draft context-aware replies in your preferred tone and style. You just need to review, make minor edits if necessary, and hit send."
//         },
//         {
//             question: "How does meeting scheduling work?",
//             answer: "Simply forward a meeting request to Meeco or ask it to find a time. It will coordinate with the other party, find a suitable slot based on your calendar, and schedule the meeting for you."
//         },
//         {
//             question: "Which email providers are supported?",
//             answer: "Meeco currently supports Gmail and Outlook. We are working on adding support for other major email providers in the near future."
//         }
//     ];

//     return (
//         <div className="bg-[#FCFDFD] font-sans text-gray-800">
//             <Head>
//                 <title>Meeco - Your AI Email Companion</title>
//                 <meta name="description" content="From Inbox Chaos to Clarity. Meeco is your AI email assistant for delightful scheduling and effortless inbox management." />
//                 <link rel="icon" href="/favicon.ico" />
//                 <link rel="preconnect" href="https://fonts.googleapis.com" />
//                 <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
//                 {/* <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" /> */}
//             </Head>

//             {/* Header */}
//             <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50">
//                 <div className="container mx-auto px-6 py-4 flex justify-between items-center">
//                     <div className="text-2xl font-bold font-serif" style={{ fontFamily: "'Lora', serif", color: "#333" }}>
//                         meeco
//                     </div>
//                     <div className="flex items-center space-x-4">
//                         <button className="text-gray-600 hover:text-black">Login</button>




//                        <button
//       onClick={() => router.push("/auth/signup")}
//       className="bg-[#31B8C6] text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">

//       <p>Sign up</p>
//     </button>


//                     </div>
//                 </div>
//             </header>

//             <main className="pt-20">
//                 {/* Hero Section */}
//                 <section className="text-center py-20 md:py-32">
//                     <div className="container mx-auto px-6">
//                         <h1 className="text-5xl md:text-7xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
//                             From inbox to action
//                         </h1>
//                         <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
//                             Turn your inbox into scheduled meetings, drafted replies, and clear priorities.
//                         </p>
//                         <div className="mt-8">
//                             <p className="text-sm text-gray-500 mb-4">Try with one-click</p>
//                             <div className="flex justify-center items-center space-x-4">
//                                 <button className="flex items-center justify-center bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
//                                     <GoogleIcon />
//                                     <span>Gmail</span>
//                                 </button>
//                                 <button className="flex items-center justify-center bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
//                                     <OutlookIcon />
//                                     <span>Outlook</span>
//                                 </button>
//                             </div>
//                         </div>
//                         <div className="mt-16 w-full max-w-4xl mx-auto h-96 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center">
//                             <p className="text-gray-500">[Product screenshot showcasing scheduling feature]</p>
//                         </div>
//                     </div>
//                 </section>

//                 {/* Features */}
//                 <section className="py-16 md:py-24 space-y-24">
//                     {/* Feature 1: Scheduling */}
//                     <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
//                         <div className="text-center md:text-left">
//                             <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
//                                 Delightful scheduling and calendar management
//                             </h2>
//                         </div>
//                         <div className="w-full h-80 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center">
//                             <p className="text-gray-500">[UI for calendar management]</p>
//                         </div>
//                     </div>

//                     {/* Feature 2: Inbox Zero */}
//                      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
//                          <div className="w-full h-80 bg-gray-200 rounded-xl shadow-lg order-last md:order-first flex items-center justify-center">
//                              <p className="text-gray-500">[UI for inbox organization]</p>
//                          </div>
//                         <div className="text-center md:text-left">
//                              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
//                                 Inbox zero, daily
//                             </h2>
//                             <p className="mt-4 text-lg text-gray-600">
//                                 Email assistant automatically tags emails so you can focus on what matters.
//                             </p>
//                         </div>
//                     </div>

//                     {/* Feature 3: Respond Effortlessly */}
//                     <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
//                          <div className="text-center md:text-left">
//                              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
//                                 Respond to emails effortlessly
//                             </h2>
//                             <p className="mt-4 text-lg text-gray-600">
//                                 AI-drafted responses appear in replies automatically, matching your tone and style.
//                             </p>
//                         </div>
//                         <div className="w-full h-80 bg-gray-200 rounded-xl shadow-lg flex items-center justify-center">
//                              <p className="text-gray-500">[UI for AI-drafted reply]</p>
//                          </div>
//                     </div>
//                 </section>

//                 {/* CTA Banner */}
//                 <section className="py-16 md:py-20">
//                     <div className="container mx-auto px-6">
//                         <div className="relative bg-gray-800 rounded-xl p-12 text-center overflow-hidden">
//                              <div 
//                                 className="absolute inset-0 bg-cover bg-center opacity-20" 
//                                 style={{backgroundImage: "url('https://images.unsplash.com/photo-1554672488-53c81411559a?q=80&w=2940&auto=format&fit=crop')"}}>
//                             </div>
//                             <div className="relative">
//                                 <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
//                                     An assistant for every inbox
//                                 </h2>
//                                 <button className="mt-8 bg-[#31B8C6] text-white font-medium py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors">
//                                     Get Started
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </section>


//                 {/* FAQ Section */}
//                 <section className="py-16 md:py-24">
//                     <div className="container mx-auto px-6 max-w-3xl">
//                         <h2 className="text-center text-4xl font-bold mb-12" style={{ fontFamily: "'Lora', serif" }}>
//                             FAQs
//                         </h2>
//                         <div className="space-y-4">
//                             {faqData.map((faq, index) => (
//                                 <FaqItem key={index} question={faq.question} answer={faq.answer} />
//                             ))}
//                         </div>
//                     </div>
//                 </section>
//             </main>

//             {/* Footer */}
//             <footer className="bg-black text-white">
//                 <div className="container mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
//                     <div className="col-span-2 md:col-span-1">
//                         <div className="text-2xl font-bold font-serif" style={{ fontFamily: "'Lora', serif" }}>
//                             meeco
//                         </div>
//                     </div>
//                     <div>
//                         <h3 className="font-bold mb-4">COMPANY</h3>
//                         <ul className="space-y-2 text-gray-400">
//                             <li><a href="#" className="hover:text-white">Careers</a></li>
//                             <li><a href="#" className="hover:text-white">Press</a></li>
//                             <li><a href="#" className="hover:text-white">Security</a></li>
//                             <li><a href="#" className="hover:text-white">Terms</a></li>
//                         </ul>
//                     </div>
//                      <div>
//                         <h3 className="font-bold mb-4">PRODUCT</h3>
//                         <ul className="space-y-2 text-gray-400">
//                             <li><a href="#" className="hover:text-white">Desktop App</a></li>
//                             <li><a href="#" className="hover:text-white">iPhone App</a></li>
//                             <li><a href="#" className="hover:text-white">Android App</a></li>
//                             <li><a href="#" className="hover:text-white">API</a></li>
//                         </ul>
//                     </div>
//                     <div>
//                         <h3 className="font-bold mb-4">RESOURCES</h3>
//                         <ul className="space-y-2 text-gray-400">
//                             <li><a href="#" className="hover:text-white">Getting Started</a></li>
//                             <li><a href="#" className="hover:text-white">General FAQs</a></li>
//                             <li><a href="#" className="hover:text-white">Contact Us</a></li>
//                         </ul>
//                     </div>
//                      <div>
//                         <h3 className="font-bold mb-4">FOLLOW US</h3>
//                         <ul className="space-y-2 text-gray-400">
//                             <li><a href="#" className="hover:text-white">X (Twitter)</a></li>
//                             <li><a href="#" className="hover:text-white">LinkedIn</a></li>
//                             <li><a href="#" className="hover:text-white">YouTube</a></li>
//                         </ul>
//                     </div>
//                 </div>
//                 <div className="container mx-auto px-6 py-6 border-t border-gray-800 text-center text-gray-500 text-sm">
//                     <p>&copy; {new Date().getFullYear()} Meeco Inc. - Your AI Email Companion</p>
//                 </div>
//             </footer>
//         </div>
//     );
// }


//-------------------------------------------------------------------------



import Head from 'next/head';
import { useState } from 'react';
import bgImage from './assets/images/learn.png';

// --- SVG Icons (for single-file convenience) ---
// These are kept for the Gmail/Outlook buttons in the hero section.

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.356-11.01-7.928l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.417 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const OutlookIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
        <path d="M1.5,18.16V5.84A2.34,2.34,0,0,1,3.84,3.5H14.28a1,1,0,0,1,.7.28l5.42,5.14a1,1,0,0,1,.31.72V18.16A2.34,2.34,0,0,1,18.34,20.5H3.84A2.34,2.34,0,0,1,1.5,18.16Z" fill="#0072C6"></path>
        <path d="M14.6,3.5l5.8,5.5V5.84A2.34,2.34,0,0,0,18.34,3.5Z" fill="#00599D"></path>
        <path d="M9.13,10.28a1,1,0,0,1,1.17-.1l5.44,3.4a.5.5,0,0,1,0,.84l-5.44,3.4a1,1,0,0,1-1.55-.84V11A1,1,0,0,1,9.13,10.28Z" fill="#FFFFFF"></path>
        <path d="M4,7.5A1.5,1.5,0,0,1,5.5,6h4A1.5,1.5,0,0,1,11,7.5v9A1.5,1.5,0,0,1,9.5,18h-4A1.5,1.5,0,0,1,4,16.5Z" fill="#2D9BDB"></path>
        <path d="M4,7.5A1.5,1.5,0,0,1,5.5,6h4A1.5,1.5,0,0,1,11,7.5v.5H5.5A1.5,1.5,0,0,0,4,9.5Z" fill="#FFFFFF" opacity="0.5"></path>
    </svg>
);

const PlusIcon = () => (
    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

const MinusIcon = () => (
    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
);


// --- FAQ Item Component ---
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 py-6">
            <button
                className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{question}</span>
                {isOpen ? <MinusIcon /> : <PlusIcon />}
            </button>
            {isOpen && (
                <div className="mt-4 text-gray-600">
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
};

// --- Main Landing Page Component ---
export default function Home() {
    const router = useRouter(); // Initialize useRouter

    const faqData = [
        {
            question: "How does Meeco handle long email threads?",
            answer: "Meeco's 'On-Demand Thread Summarization' feature instantly provides concise, bulleted summaries of long email chains with more than 3 replies, highlighting key points, decisions, and action items."
        },
        {
            question: "Can Meeco help me improve my email writing?",
            answer: "Absolutely. Our 'AI-Powered Writing Assistant' allows you to highlight your draft and ask Meeco to 'Improve Writing,' 'Make it more formal,' 'Make it more concise,' or 'Check for clarity,' ensuring your emails are always professional and effective."
        },
        {
            question: "What is the 'Daily Digest' feature?",
            answer: "The 'Daily Digest' is a single, comprehensive email or in-app view that summarizes all important emails from the previous day, lists key action items, and flags anything requiring an immediate reply, so you always know what you missed."
        },
        {
            question: "How does Meeco organize my incoming emails?",
            answer: "Meeco utilizes 'Automated Triage & Labeling'. The AI analyzes incoming emails and applies smart labels like **Focus** (urgent), **Review** (important, non-urgent), or **Archive** (newsletters, receipts) to create a highly prioritized inbox."
        },
        {
            question: "Can I search my entire email history using natural language?",
            answer: "Yes, with 'Agentic Search: Ask Your Inbox', you can use natural language queries like 'Find the invoice from Figma last month' or 'What was the deadline for Project Phoenix?' to instantly retrieve specific information from your entire email history."
        },
        {
            question: "Does Meeco support multiple email accounts?",
            answer: "Yes, Meeco offers 'Multi-Account Integration & Unified Inbox'. You can connect multiple Gmail accounts and view them all in a single, unified inbox dashboard or easily switch between accounts using our Chrome plugin."
        },
        {
            question: "Can I automate repetitive email tasks?",
            answer: "Our 'Custom User Instructions & Triggers' feature (Rules Engine) allows you to create 'if-this-then-that' workflows to automate routine tasks, such as summarizing unread emails every morning or forwarding specific emails to your accountant."
        },
        {
            question: "How does Meeco help with quick replies?",
            answer: "Meeco's 'Smart Reply (Basic Context)' reads your open email and suggests 1-3 short, relevant reply drafts, such as 'Thanks, I'll look into this' or 'Got it, I'll get back to you by end of day,' saving you time on common responses."
        },
        {
            question: "Does Meeco offer AI Autocomplete?",
            answer: "Yes, Meeco includes 'AI Autocomplete' to help you compose emails faster by suggesting words and phrases as you type, making your writing process more efficient and seamless."
        },
        {
            question: "Can I see a history of my AI interactions?",
            answer: "Yes, Meeco provides 'Chat History' where you can review your past interactions with the AI assistant, including summaries, writing improvements, and search queries, giving you a clear record of Meeco's assistance."
        }
    ];

    return (
        <div className="bg-[#FCFDFD] font-sans text-gray-800">
            <Head>
                <title>Meeco - Your AI Email Companion</title>
                <meta name="description" content="From Inbox Chaos to Clarity. Meeco is your AI email assistant for delightful scheduling and effortless inbox management." />
                <link rel="icon" href="/favicon.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold font-serif" style={{ fontFamily: "'Lora', serif", color: "#333" }}>
                        meeco
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.push("/auth/login")} className="text-gray-600 hover:text-black">Login</button>
                        <button
                            onClick={() => router.push("/auth/signup")}
                            className="bg-[#31B8C6] text-white font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                            Sign up
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-20">
                {/* Hero Section */}
                <div className="bg-white px-4 sm:px-6 lg:px-12 py-8">
                    <section className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative text-center bg-[#14161F]">

                        {/* Background image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: "url('/hero.png')" }}
                        ></div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-blue-900/20"></div>

                        {/* Content */}
                        <div className="container mx-auto px-6 relative z-10 py-20 md:py-32">
                            <h1
                                className="text-5xl md:text-7xl font-bold tracking-tight text-white"
                                style={{ fontFamily: "'Lora', serif" }}
                            >
                                From inbox to action
                            </h1>
                            <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                                Transform your email experience. Meeco uses advanced AI to summarize, draft, organize, and automate your inbox, turning chaos into clarity.
                            </p>

                            <div className="mt-8">
                                <p className="text-sm text-gray-300 mb-4">Integrate with one-click</p>
                                <div className="flex justify-center items-center space-x-4">
                                    <button className="flex items-center justify-center bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-lg transform hover:scale-105">
                                        <GoogleIcon />
                                        <span>Gmail</span>
                                    </button>
                                    <button className="flex items-center justify-center bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-lg transform hover:scale-105">
                                        <OutlookIcon />
                                        <span>Outlook</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Features Section */}
                <section className="py-16 md:py-24 space-y-20 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <h2 className="text-center text-4xl font-bold mb-16" style={{ fontFamily: "'Lora', serif" }}>
                            Intelligent Features, Effortless Email
                        </h2>

                        {/* Feature 1: On-Demand Thread Summarization */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Summarize Threads Instantly
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Got added to a long email chain? Meeco gives you a concise, bulleted summary of key points, decisions, and action items with a single click, saving you precious time.
                                </p>
                            </div>
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {/* Future: Icon or small illustration here */}
                            </div>
                        </div>

                        {/* Feature 2: AI-Powered Writing Assistant */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 order-last md:order-first">
                                {/* Future: Icon or small illustration here */}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Craft Perfect Emails with AI
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Ensure every email you send is clear and professional. Meeco's AI assists you in improving writing, adjusting tone, and making your messages concise before you hit send.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3: The Daily Digest */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Your Personalized Daily Catch-up
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Never miss an important update. Meeco compiles a daily digest of all crucial emails from the previous day, highlights action items, and flags anything needing immediate attention.
                                </p>
                            </div>
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {/* Future: Icon or small illustration here */}
                            </div>
                        </div>

                        {/* Feature 4: Automated Triage & Labeling */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 order-last md:order-first">
                                {/* Future: Icon or small illustration here */}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    An Organized Inbox, Automatically
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Tired of a cluttered inbox? Meeco intelligently categorizes your incoming emails with smart labels like **Focus**, **Review**, and **Archive**, giving you a clean, prioritized view.
                                </p>
                            </div>
                        </div>

                        {/* Feature 5: Agentic Search: "Ask Your Inbox" */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Find Anything, Just Ask
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Go beyond keyword searches. Our 'Ask Your Inbox' feature lets you use natural language to find specific invoices, deadlines, or files across your entire email history, turning your inbox into an intelligent knowledge base.
                                </p>
                            </div>
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {/* Future: Icon or small illustration here */}
                            </div>
                        </div>

                        {/* Feature 6: Multi-Account Integration & Unified Inbox */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 order-last md:order-first">
                                {/* Future: Icon or small illustration here */}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Manage All Accounts in One Place
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Seamlessly connect multiple Gmail accounts. Meeco provides a 'Unified Inbox' view on the web dashboard and easy switching via the Chrome plugin, streamlining your multi-account management.
                                </p>
                            </div>
                        </div>

                        {/* Feature 7: Custom User Instructions & Triggers */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Automate Your Email Workflow
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Create custom 'if-this-then-that' workflows with our 'Rules Engine'. Automate routine tasks like daily unread email summaries, or forwarding specific emails to your accountant, saving countless hours.
                                </p>
                            </div>
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {/* Future: Icon or small illustration here */}
                            </div>
                        </div>

                        {/* Feature 8: Smart Reply (Basic Context) */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 order-last md:order-first">
                                {/* Future: Icon or small illustration here */}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Quick Replies, Smarter Conversations
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Meeco understands the context of your open emails and suggests 1-3 short, relevant reply drafts, making it easy to send common responses and keep your conversations flowing effortlessly.
                                </p>
                            </div>
                        </div>

                        {/* Feature 9: AI Autocomplete */}
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Accelerate Your Writing with Autocomplete
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Boost your email writing speed and efficiency. Meeco's AI Autocomplete intelligently suggests words and phrases as you type, helping you compose messages faster and with greater accuracy.
                                </p>
                            </div>
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {/* Future: Icon or small illustration here */}
                            </div>
                        </div>

                        {/* Feature 10: Chat History */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Placeholder for future visual or more text */}
                            <div className="hidden md:block h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 order-last md:order-first">
                                {/* Future: Icon or small illustration here */}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>
                                    Keep Track of AI Interactions
                                </h3>
                                <p className="text-lg text-gray-600">
                                    Meeco Chat History logs all your past interactions with the AI assistant, providing a clear record of summaries, writing improvements, and search queries, ensuring you never lose track of valuable insights.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* CTA Banner */}



                {/* FAQ Section */}
                <div className="bg-[#F8F7F4] p-8 md:p-16">

                    {/*
    The section is now constrained in width (max-w-6xl) and centered (mx-auto)
    to match the desired layout from the image.
  */}
                    <section
                        className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative"
                    >
                        {/* The background image container */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: "url('/section.avif')" }}
                        ></div>

                        {/* 
      The overlay now includes `backdrop-blur-md` to apply a blur effect 
      to the background image behind it.
    */}
                        <div className="absolute inset-0 bg-black/30"></div>

                        {/* The content container remains on top */}
                        <div className="container mx-auto px-6 text-center relative z-10 py-16 md:py-24">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">
                                An intelligent assistant for <span className="font-serif italic font-normal">every inbox</span>
                            </h2>

                            {/* The two buttons for call-to-action */}
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                <button className="bg-[#31B8C6] text-white font-medium py-3 px-8 rounded-full hover:bg-opacity-80 transition-all text-lg shadow-lg transform hover:scale-105">
                                    Get started
                                </button>
                                <button className="bg-transparent border-2 border-white text-white font-medium py-3 px-8 rounded-full hover:bg-white hover:text-gray-800 transition-all text-lg shadow-lg transform hover:scale-105">
                                    Learn more
                                </button>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer className="bg-black text-white">
                <div className="container mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-2xl font-bold font-serif" style={{ fontFamily: "'Lora', serif" }}>
                            meeco
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">COMPANY</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Careers</a></li>
                            <li><a href="#" className="hover:text-white">Press</a></li>
                            <li><a href="#" className="hover:text-white">Security</a></li>
                            <li><a href="#" className="hover:text-white">Terms</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">PRODUCT</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Desktop App</a></li>
                            <li><a href="#" className="hover:text-white">iPhone App</a></li>
                            <li><a href="#" className="hover:text-white">Android App</a></li>
                            <li><a href="#" className="hover:text-white">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">RESOURCES</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Getting Started</a></li>
                            <li><a href="#" className="hover:text-white">General FAQs</a></li>
                            <li><a href="#" className="hover:text-white">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4">FOLLOW US</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">X (Twitter)</a></li>
                            <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                            <li><a href="#" className="hover:text-white">YouTube</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 py-6 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Meeco Inc. - Your AI Email Companion</p>
                </div>
            </footer>
        </div>
    );
}