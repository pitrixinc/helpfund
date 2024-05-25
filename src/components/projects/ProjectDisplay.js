import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import DefaultProjectDisplay from './DefaultProjectDisplay';

const ProjectDisplay = ({ filters, sortOption }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter approved projects
      const approvedProjects = projectsList.filter(project => project.isApproved);

      setProjects(approvedProjects);
      applyFiltersAndSorting(approvedProjects);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting(projects);
  }, [filters, sortOption, projects]);

  const applyFiltersAndSorting = (projectsList) => {
    let filtered = projectsList;

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(project => project.category === filters.category);
    }
    if (filters.goalRange) {
      const [minGoal, maxGoal] = getGoalRange(filters.goalRange);
      filtered = filtered.filter(project => project.goal >= minGoal && project.goal <= maxGoal);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    // Apply other filters similarly...

    // Apply sorting
    switch (sortOption) {
      case 'mostFunded':
        filtered.sort((a, b) => b.goal - a.goal);
        break;
      case 'mostBacked':
        filtered.sort((a, b) => b.backerCount - a.backerCount);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
        break;
      case 'endingSoon':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'goalProgress':
        filtered.sort((a, b) => (b.fundedAmount / b.goal) - (a.fundedAmount / a.goal));
        break;
      case 'recentlyUpdated':
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      default:
        filtered.sort((a, b) => a.title.localeCompare(b.title)); // default to alphabetical
        break;
    }

    setFilteredProjects(filtered);
  };

  // Check if any filters or sorting options have been applied
  const isFilteredOrSorted = filters.category || filters.goalRange || filters.searchTerm || sortOption;


  return (
    <div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">

        <div class="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
            <h2 class="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white">Featured Projects</h2>
            <p class="mt-1 text-gray-600 dark:text-neutral-400">Creative people</p>
        </div>
       
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
{/* 
      {filteredProjects.map(project => (
        <div key={project.id} className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-bold">{project.title}</h2>
          <p>{project.description}</p>
          
        </div>
      ))}
      */}
{!isFilteredOrSorted === null ? (
        <DefaultProjectDisplay />
      ) : (
 filteredProjects.map(project => (
<div key={project.id} class="group flex flex-col h-full bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-neutral-900 dark:border-neutral-700 dark:shadow-neutral-700/70">
          <div class="h-52 flex flex-col justify-center items-center bg-blue-600 rounded-t-xl">
            <img src={project.image} alt="project image" className='w-[56] h-[56]' />
          </div>
          <div class="p-4 md:p-6">
            <span class="block mb-1 text-xs font-semibold uppercase text-blue-600 dark:text-blue-500">
            {project.displayName}
            </span>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-neutral-300 dark:hover:text-white">
            {project.title}
            </h3>
            <p class="mt-3 text-gray-500 dark:text-neutral-500">
            {project.description}
            </p>
          </div>
          <div class="mt-auto flex border-t border-gray-200 divide-x divide-gray-200 dark:border-neutral-700 dark:divide-neutral-700">
            <a class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-es-xl bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800" href="#">
              {project.location}
            </a>
            <a class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-ee-xl bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800" href="#">
              ${project.goal}
            </a>
          </div>
        </div>
        )))} 
    </div>
    </div>
  );
};

// Helper function to get goal range values
const getGoalRange = (range) => {
  switch (range) {
    case 'low':
      return [0, 1000];
    case 'mid':
      return [1000, 10000];
    case 'high':
      return [10000, Infinity];
    default:
      return [0, Infinity];
  }
};

export default ProjectDisplay;
