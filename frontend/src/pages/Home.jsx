import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useSocket from '../hooks/useSocket';
import useStore from '../store/useStore';

export default function Home() {
  useSocket(); 
  const { activeChatId } = useStore();
  return (
    <div className="h-full grid md:grid-cols-[320px_1fr]">
      <Sidebar />
      <div className="hidden md:block">{activeChatId ? <ChatWindow/> : <EmptyState/>}</div>
      <div className="md:hidden">{activeChatId ? <ChatWindow/> : <SidebarHint/>}</div>
    </div>
  );
}
function EmptyState(){ return <div className="h-full grid place-items-center text-gray-400">Select a chat</div>; }
function SidebarHint(){ return <div className="p-4 text-gray-400">Open a chat from the sidebar</div>; }