import Image from "next/image";
import { Inter } from "next/font/google";
import Layout from "@/components/layout";
import CTA from "@/components/CTA";
import FeaturedProjects from "@/components/FeaturedProjects";
const inter = Inter({ subsets: ["latin"] });
import ProjectDetailsPage from "@/components/projects/SingleProject";
import { AiFillHome, AiOutlineClockCircle, AiOutlineInbox, AiOutlineUser } from "react-icons/ai"
import { MdOutlineAddComment, MdOutlineLocationOn, MdOutlineLockClock, MdVerified } from "react-icons/md";
import { RiContactsBook3Line, RiMoneyDollarCircleLine, RiShareBoxLine, RiSkull2Line, RiTeamLine } from "react-icons/ri";
import { BiCategoryAlt } from "react-icons/bi";
import Moment from 'react-moment';
import { toast } from 'react-toastify';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { BsGift } from "react-icons/bs";

export default function Projectid() {
  const router = useRouter();
  const { projectId } = router.query; // Extract projectId from URL parameters
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('');
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationCount, setDonationCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserData(userData);
        //  console.log("User data", userData)
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          toast.error('Project not found');
        }
      } catch (error) {
        toast.error('Error fetching project details:', error);
      }
    };

    const fetchDonations = async () => {
      try {
        const donationsQuery = query(collection(db, 'donations'), where('projectId', '==', projectId));
        const donationsSnapshot = await getDocs(donationsQuery);

        let total = 0;
        let count = 0;

        donationsSnapshot.forEach(doc => {
          total += doc.data().amount;
          count += 1;
        });

        setTotalDonations(total);
        setDonationCount(count);
      } catch (error) {
        console.error('Error fetching donations:', error);
      }
    };

    if (projectId) {
      fetchProjectDetails();
      fetchDonations();
    }
  }, [projectId]);
  
/*
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          console.error('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    };


    const fetchUserDetails = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
    };
        fetchUserDetails();

    if (projectId) {
      fetchProjectDetails();
    }


  }, [projectId]);
*/





const handlePayment = async (e) => {
  e.preventDefault();
  setLoading(true);

  if (!userData) {
    router.push('/signin');
    toast.error('Please sign in before you donate!')
  }

  const email = currentUser.email

  if (!amount || isNaN(amount) || amount <= 0) {
    toast.error('Please enter a valid amount.');
    setLoading(false);
    return;
  }

  const donationAmountNumber = parseFloat(amount);
  const amountLeft = project.goal - totalDonations;
    if (donationAmountNumber > amountLeft) {
      setErrorMessage(`You can only donate up to $ ${amountLeft} for this project.`);
      toast.error(`You can only donate up to $ ${amountLeft} for this project.`);
      setLoading(false);
      return;
    }

  if (typeof window !== "undefined") {
    const PaystackPop = (await import('@paystack/inline-js')).default;

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100, // Amount in kobo (100 kobo = 1 GHS)
      currency: 'GHS',
      callback: async (response) => {
        if (response.status === 'success') {
          await handleDonate();
        } else {
          toast.error('Payment was not successful. Please try again.');
          setLoading(false);
        }
      },
      onClose: () => {
        toast.error('Payment was not completed.');
        setLoading(false);
      },
    });
  }
};


  
  const handleDonate = async () => {
    // Handle payment logic here, e.g., integrate with a payment gateway
    // Assuming payment is successful

    const donationAmountNumber = parseFloat(amount);
 /*  if (isNaN(donationAmountNumber) || donationAmountNumber <= 0) {
      setErrorMessage('Please enter a valid donation amount.');
      toast.error('Please enter a valid donation amount.');
      return;
    }
    */

    

    try {
      await addDoc(collection(db, 'donations'), {
        projectId,
        projectTitle: project.title,
        projectImage: project.image,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userImage: currentUser.photoURL,
        amount: donationAmountNumber,
        timestamp:  new Date().toISOString(),
      });
      toast.success(`Thank you for donating $ ${donationAmountNumber} !`);
      setShowCreditCardModal(false);
      setCardNumber('');
      setExpiryDate('');
      setErrorMessage('');
      setCvv('');
      setAmount('');
      setLoading(false)
    } catch (error) {
      toast.error('Error making donation:', error);
      setErrorMessage('An error occurred while making your donation. Please try again.');
      setLoading(false)
    }
  };

   

  if (!project) {
    return <div>Loading...</div>; // Display loading indicator while fetching project details
  }

  const donationPercentage = (totalDonations / project.goal) * 100;
  const amountLeft = project.goal - totalDonations;

  return (
    <Layout className={` ${inter.className}`}>
      <div className="lg:flex m-0 md:m-10 lg:m-10 lg:space-x-5 items-center justify-center">
        <div className="md:w-[700px]">
          <div className="lg:flex-1 border-t-8 border-rose-600 bg-white pb-10">
            <div className="carousel">
              <div className={` relative w-full`}>
                <img
                  src={project.image}
                  className="w-full h-[300px] md:w-[700px] lg:w-[700px] md:h-[400px] lg:h-[400px]"
                  alt="project image"
                />
                <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2 text-white flex justify-between font-semibold tracking-widest">
                  {project.displayName}
                  <span className="flex">
                    <span className="p-1"><MdOutlineLocationOn className="text-lg" /></span>   {project.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="m-5 h-[310px] overflow-y-auto ">
            <div className="flex">
              <p className="text-2xl text-gray-700 font-bold">{project.title}</p>
              {project.isVerified && (
                <span className="text-rose-600 p-3"><MdVerified /></span>
              )}
            </div>
            <p className="my-5 flex justify-between mr-2 font-normal">
              <div className="flex">
                <span className="text-gray-400 p-1"><AiOutlineClockCircle className="" />
                </span>
                <span className="text-gray-400">Created <Moment fromNow>{project.createdAt && project.createdAt}</Moment></span>
              </div> -
              <div className="flex">
                <span className="text-rose-600 p-1"><MdOutlineLockClock className="text-lg" /></span>
                <span className="text-rose-600">Ends <Moment fromNow>{project.deadline && project.deadline}</Moment></span>
              </div>
            </p>
            <div className="mt-5 flex text-rose-600 font-semibold">
              <span className="p-1"><BiCategoryAlt /></span> <span>{project.category}</span>
            </div>
            <div className="divider"></div>
            <p className="my-5">{project.description}</p>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiMoneyDollarCircleLine /></span> <span>Outlined Budget</span>
              </div>
              <p className="my-1">{project.budget}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiTeamLine /></span> <span>Team Members</span>
              </div>
              <p className="my-1">{project.team}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><BsGift /></span> <span>Rewards</span>
              </div>
              <p className="my-1">{project.rewards}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiContactsBook3Line /></span> <span>Contact Info</span>
              </div>
              <p className="my-1">{project.contactInfo}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiShareBoxLine /></span> <span>Social Links</span>
              </div>
              <p className="my-1">{project.socialLinks}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiSkull2Line /></span> <span>Risks</span>
              </div>
              <p className="my-1">{project.risks}</p>
            </div>
            <div className="divider"></div>
            <div>
              <div className="mt-5 flex font-semibold">
                <span className="p-1"><MdOutlineAddComment /></span> <span>FAQs</span>
              </div>
              <p className="my-1">{project.faqs}</p>
            </div>
          </div>
        </div>
        <div className="lg:w-[30%] hidden lg:inline">
          <div className="bg-gray-200">
            <div className="bg-white p-5 text-sm border-double border rounded-lg">
              <div className="font-bold text-lg text-black">GHS {project.goal} {project.isVerified && (
                <span className="text-rose-600">Negotiable</span>
              )}</div>
              <div className="text-center flex my-4 font-semibold">
                <span className="p-1"><RiTeamLine /></span> <span>{donationCount} Donators</span>
            
              </div>
              <button className="items-center text-rose-500 justify-center w-full p-2 font-semibold bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
              ${totalDonations} donated, ${amountLeft} left
              </button>
            </div>
          </div>
          <div className="bg-gray-200 mt-4">
            <div className="bg-white p-5 text-sm border-double border rounded-lg">
              <div className="flex items-center space-x-4">
                <img className="w-10 h-10 rounded-full" src={project.addedByImage} alt="profile" />
                <div className="font-medium dark:text-black mb-2">
                  <div className="text-black">{project.displayName && project.displayName.slice(0, 15)}</div>
                  <div className="text-[8px] flex text-black bg-gray-100 rounded-lg"><AiFillHome className="text-[12px] text-yellow-600 mt-1 mr-1" /> Typically replies within a few hours</div>
                  <div className="text-[8px] flex text-black bg-gray-100 rounded-lg"><AiFillHome className="text-[12px] mt-1 mr-1" /><span className="text-[10px]"> Creator since <Moment fromNow>{userData && userData.createdAt}</Moment></span></div> 
                </div>
              </div>
              {totalDonations < project.goal ? (
                <>
                  <input type="number" placeholder="Enter Donation Amount (GHS)" value={amount} onChange={(e) => setAmount(e.target.value)} required
                   class="py-2 mb-1 px-3 pe-11 block w-full border-gray-200 shadow-sm rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" />
              <button
                className="items-center bg-rose-500 justify-center w-full p-2 text-white border border-rose-500 hover:bg-green-100 hover:text-green-500 hover:border-green-600 mb-4"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed By Donating GHS' + amount}
              </button>
              {errorMessage && <p className="text-red-600 text-center font-semibold">{errorMessage}</p>}
              </>
              ) : (
                  <button
                    disabled
                    className="items-center bg-green-500 justify-center w-full p-2 text-white border border-green-500 mb-4"
                  >
                    Goal Achieved
                  </button>
              )}
              <button className="items-center text-rose-500 justify-center w-full p-2 bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: `${donationPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500"></div>
                </div>
                <span className="text-gray-600 font-semibold">{donationPercentage.toFixed(2)}% funded</span>
              </div>
              </button>
            </div>
          </div>

{/*
          <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: `${donationPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-600"></div>
                </div>
                <span className="text-gray-600">{donationPercentage.toFixed(2)}% funded</span>
              </div>
              */}

          <div className="bg-gray-200 mt-4">
            <div className="bg-white p-5 text-sm border rounded-lg">
              <div className="font-bold text-center text-black">Safety tips</div>
              <ul className="list-disc ml-6 text-black font-normal text-[10px]">
                <li>Dont pay in advance, including for delivery</li>
                <li>Meet the seller at a safe public place</li>
                <li>Inspect the item and ensure its exactly what you want</li>
                <li>On delivery, check that the item delivered is what was inspected</li>
                <li>Only pay when you are satisfied</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-200 mt-4">
            <div className="bg-white p-5 text-sm border rounded-lg">
              <div className="flex justify-between mt-3">
                <button className="text-blue-500 hover:bg-blue-600 hover:text-white bg-white px-4 py-2 rounded text-[10px] border border-blue-500">
                  Mark Unavailable
                </button>
                <button className="text-red-500 hover:bg-red-500 hover:text-white bg-white px-4 py-2 rounded text-[10px] border border-red-500">
                  <AiFillHome className="text-[12px] text-red-600" /> Report Abuse
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-200 mt-4">
            <div className="bg-white p-5 text-sm border rounded-lg">
              <button className="items-center text-rose-500 justify-center font-semibold w-full p-2 bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
                Post Ad Like This
              </button>
            </div>
          </div>
        </div>
      </div>
      {
      showCreditCardModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Make a Donation</h2>
            <div className="mb-4">
              <label className="block mb-1">Card Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Expiry Date</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">CVV</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Amount</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreditCardModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-rose-500 text-white px-4 py-2 rounded"
                onClick={handlePayment}
              >
                Make Payment
              </button>
            </div>
            {errorMessage && <p className="text-red-600 text-center font-semibold">{errorMessage}</p>}
          </div>
        </div>
      )}
    </Layout>
  );
}



















{/*
import Image from "next/image";
import { Inter } from "next/font/google";
import Layout from "@/components/layout";
import CTA from "@/components/CTA";
import FeaturedProjects from "@/components/FeaturedProjects";
const inter = Inter({ subsets: ["latin"] });
import ProjectDetailsPage from "@/components/projects/SingleProject";
import { AiFillHome, AiOutlineClockCircle, AiOutlineInbox, AiOutlineUser } from "react-icons/ai"
import { MdOutlineAddComment, MdOutlineLocationOn, MdOutlineLockClock, MdVerified } from "react-icons/md";
import { RiContactsBook3Line, RiMoneyDollarCircleLine, RiShareBoxLine, RiSkull2Line, RiTeamLine } from "react-icons/ri";
import { BiCategoryAlt } from "react-icons/bi";
import Moment from 'react-moment';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { BsGift } from "react-icons/bs";

export default function Projectid() {
  const router = useRouter();
  const { projectId } = router.query; // Extract projectId from URL parameters

  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          console.error('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  if (!project) {
    return <div>Loading...</div>; // Display loading indicator while fetching project details
  }

  return (
    <Layout
      className={` ${inter.className}`}
      >
     <div className="lg:flex m-0 md:m-10 lg:m-10 lg:space-x-5 items-center justify-center">
        <div className="md:w-[700px]">
        <div className="lg:flex-1 border-t-8 border-rose-600 bg-white pb-10">
        <div className="carousel">
        <div
          className={` relative w-full`}
        >
          <img src={project.image} className="w-full h-[300px] md:w-[700px] lg:w-[700px] md:h-[400px]  lg:h-[400px]" alt="project image" />
          <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2 text-white flex justify-between font-semibold tracking-widest">
               {project.displayName}
                <span className="flex">
                <span className="p-1"><MdOutlineLocationOn className="text-lg"/></span>   {project.location}
                </span>
           </div>
          
        </div>
    </div>
    </div>
          <div className="m-5 h-[310px] overflow-y-auto ">
            <div className="flex">
            <p className="text-2xl text-gray-700 font-bold">{project.title}</p>

            {project.isVerified && (
              <span className="text-rose-600 p-3"><MdVerified /></span>
            )}
            </div>
            <p className="my-5 flex justify-between mr-2 font-normal">
              <div className="flex">
            <span className="text-gray-400 p-1"><AiOutlineClockCircle className="" />
            </span>
            <span className="text-gray-400">Created <Moment fromNow>{project.createdAt && project.createdAt}</Moment></span>
            </div> - 
            <div className="flex">
            <span className="text-rose-600 p-1"><MdOutlineLockClock className="text-lg"/></span> 
            <span className="text-rose-600">Ends <Moment fromNow>{project.deadline && project.deadline}</Moment></span>
            </div>
            </p>

            <div className="mt-5 flex text-rose-600 font-semibold">
            <span className="p-1"><BiCategoryAlt/></span> <span>{project.category}</span>
            </div>

            <div className="divider"></div>
           
            <p className="my-5">{project.description}</p>
            
            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiMoneyDollarCircleLine /></span> <span>Outlined Budget</span>
                </div>
                <p className="my-1">{project.budget}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiTeamLine /></span> <span>Team Members</span>
                </div>
                <p className="my-1">{project.team}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><BsGift /></span> <span>Rewards</span>
                </div>
                <p className="my-1">{project.rewards}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiContactsBook3Line /></span> <span>Contact Info</span>
                </div>
                <p className="my-1">{project.contactInfo}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiShareBoxLine /></span> <span>Social Links</span>
                </div>
                <p className="my-1">{project.socialLinks}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><RiSkull2Line /></span> <span>Risks</span>
                </div>
                <p className="my-1">{project.risks}</p>
            </div>

            <div className="divider"></div>

            <div>
                <div className="mt-5 flex font-semibold">
                <span className="p-1"><MdOutlineAddComment /></span> <span>FAQs</span>
                </div>
                <p className="my-1">{project.faqs}</p>
            </div>

           
          </div>
        </div>

        <div className="lg:w-[30%] hidden lg:inline">
  <div className="bg-gray-200">
    <div className="bg-white p-5 text-sm border-double border rounded-lg">
      <div className="font-bold text-lg text-black">GHS {project.goal}, {project.isVerified && (
              <span className="text-rose-600">Negotiable</span>
            )}</div>
            <div className="text-center my-4">
       <span className="text-rose-600 text-[11px]">Market Price: GHS {project.goal}</span>
            </div>
      <button className="items-center text-rose-500 justify-center w-full p-2 bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
          Request call back
      </button>
    </div>
  </div>

  <div className="bg-gray-200 mt-4">
    <div className="bg-white p-5 text-sm border-double border rounded-lg">
        
<div className="flex items-center space-x-4">
    <img className="w-10 h-10 rounded-full" src={project.addedByImage} alt="profile" />
    <div className="font-medium dark:text-black mb-2">
        <div className="text-black">{project.displayName && project.displayName.slice(0, 15)}</div>
        <div className="text-[8px] text-black bg-gray-100 rounded-lg"><AiFillHome className="text-[12px] text-yellow-600"/> Typically replies within a few hours</div>
        <AiFillHome className="text-[10px]"/><span className="text-[10px]"> Posted on: {project.createdAt}</span>
    </div>
</div>
      <button className="items-center bg-rose-500 justify-center w-full p-2 text-white border border-rose-500 hover:bg-green-100 hover:text-green-500 hover:border-green-600 mb-4"
       
      >
          Show Contact
      </button>
      <button className="items-center text-rose-500 justify-center w-full p-2 bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
          Start Chat
      </button>
    </div>
  </div>


  <div className="bg-gray-200 mt-4">
    <div className="bg-white p-5 text-sm border rounded-lg">
      <div className="font-bold text-center text-black">Safety tips</div>
      <ul className="list-disc ml-6 text-black font-normal text-[10px]">
        <li>Dont pay in advance, including for delivery</li>
        <li>Meet the seller at a safe public place</li>
        <li>Inspect the item and ensure its exactly what you want</li>
        <li>On delivery, check that the item delivered is what was inspected</li>
        <li>Only pay when you are satisfied</li>
      </ul>
    </div>
  </div>

  <div className="bg-gray-200 mt-4">
    <div className="bg-white p-5 text-sm border rounded-lg">
    <div className="flex justify-between mt-3">
      <button className="text-blue-500 hover:bg-blue-600 hover:text-white bg-white px-4 py-2 rounded text-[10px] border border-blue-500">
        Mark Unavailable
      </button>
      <button className="text-red-500 hover:bg-red-500 hover:text-white bg-white px-4 py-2 rounded text-[10px] border border-red-500">
           <AiFillHome className="text-[12px] text-red-600"/>  Report Abuse
      </button>
    </div>
    </div>
  </div>

  <div className="bg-gray-200 mt-4">
    <div className="bg-white p-5 text-sm border rounded-lg">
      <button className="items-center text-rose-500 justify-center font-semibold w-full p-2 bg-white border border-rose-500 hover:bg-green-100 hover:border-green-600">
          Post Ad Like This
      </button>
    </div>
  </div>
</div>

      </div>
    </Layout>
  );
}

*/}