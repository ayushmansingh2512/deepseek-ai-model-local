import React, { useState } from 'react';
import axios from 'axios';
import { File, Loader, LoaderPinwheel, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Ask = () => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false); // ✅ Loading state

    const sendMessage = async () => {
        if (!message.trim()) {
            toast.error('You need to write something in the chat!');
            return;
        }

        setChat(prevChat => [...prevChat, { user: 'You', text: message }]);
        setMessage('');
        setLoading(true); // ✅ Start loading

        try {
            const response = await axios.post('http://localhost:5000/api/chat', { message });
            setChat(prevChat => [...prevChat, { user: 'AI', text: response.data.reply }]);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Try again.');
        } finally {
            setLoading(false); // ✅ Stop loading after getting the response
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setPdfFile(file);
            setFileName(file.name);
            setLoading(true); // ✅ Start loading
            const formData = new FormData();
            formData.append('pdf', file);

            try {
                const response = await axios.post('http://localhost:5000/api/summarize-pdf', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setSummary(response.data.summary);
                toast.success('PDF uploaded successfully!');
            } catch (error) {
                console.error('Error uploading PDF:', error);
                toast.error('Failed to upload PDF. Please try again.');
            } finally {
                setLoading(false); // ✅ Stop loading after getting the response
            }
        }
    };

    return (
        <div className="p-5 flex flex-col items-center w-screen justify-between  bg-gray-950 text-gray-100 h-screen">
            <Toaster position="top-center" reverseOrder={false} />

            <div className='flex flex-col gap-3 w-[100vh]'>
                {chat.map((msg, index) => (
                    <p className='text-gray-400' key={index}>
                        <strong>{msg.user}:</strong> {msg.text}
                    </p>
                ))}

                {summary && (
                    <div className='text-gray-400'>
                        <h4 className='pb-3 font-bold'>PDF Summary:</h4>
                        <p>{summary}</p>
                    </div>
                )}

                {/* ✅ Spinning Loader Below Messages */}
                {loading && (
                    <motion.div
                        className="flex  justify-center  items-start  mt-3"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                        <LoaderPinwheel className="text-gray-400 w-8 h-8 flex" />
                    </motion.div>
                )}

                {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
            </div>

            <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className='flex gap-5 flex-col item-center w-[100vh]'>    
                <div className='flex gap-5 border-2 border-gray-400 px-5 items-center rounded-md py-0.5'>
                    {/* Message Input */}
                    <input
                        className='overflow-y-auto w-[100vh] focus:ring-0 focus:outline-none'
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask"
                    />

                    {/* Send Icon */}
                    <Send onClick={sendMessage} className="cursor-pointer" />

                    {/* Hidden File Input */}
                    <input className='hidden' type="file" accept="application/pdf" onChange={handlePdfUpload} id='pdf-upload' />

                    {/* Custom File Upload Button */}
                    <label htmlFor="pdf-upload" className="cursor-pointer flex items-center gap-2 border-gray-400 py-2 rounded-full hover:bg-gray-700">
                        <File size={20} />
                    </label>
                </div>
            </motion.div>
        </div>
    );
};

export default Ask;
