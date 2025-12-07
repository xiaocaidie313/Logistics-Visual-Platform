import UserHome from "./UserHome";
import UserOrders from "./UserOrders";
import UserProfile from "./UserProfile";

interface UserContentProps {
  activeTab: string;
} 

const UserContent = ({ activeTab }: UserContentProps) => {

  const renderContent = ()=>{
    switch(activeTab){
      case 'home':
        return <UserHome />;
      case 'orders':
        return <UserOrders />;
      case 'profile':
        return <UserProfile />;
    }
  }
  return (
    <div>
      {renderContent()}
    </div>
  )
};

export default UserContent;