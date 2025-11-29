import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Chart options
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Herb Distribution',
    },
  },
};

const pieOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Organic vs. Non-Organic',
    },
  },
};

const lineOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Registration Trends',
    },
  },
};

const EnhancedAnalyticsDashboard = ({ herbs = [] }) => {
  const [loading, setLoading] = useState(true);
  const [herbsData, setHerbsData] = useState([]);
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    if (herbs && herbs.length > 0) {
      setHerbsData(herbs);
      setLoading(false);
    }
  }, [herbs]);

  // Filter herbs by timeframe
  const getFilteredHerbs = () => {
    if (timeframeFilter === 'all') return herbsData;

    const now = new Date();
    let compareDate = new Date();
    
    switch(timeframeFilter) {
      case 'week':
        compareDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        compareDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        compareDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return herbsData;
    }

    return herbsData.filter(herb => {
      const herbDate = new Date(herb.createdAt);
      return herbDate >= compareDate;
    });
  };

  // Prepare data for charts
  const prepareChartData = () => {
    const filteredHerbs = getFilteredHerbs();
    
    // Group herbs by name/type
    const herbCounts = filteredHerbs.reduce((acc, herb) => {
      const name = herb.herbName || herb.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    // Herb distribution chart data
    const distributionData = {
      labels: Object.keys(herbCounts),
      datasets: [
        {
          label: 'Number of Batches',
          data: Object.values(herbCounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Organic vs non-organic chart data
    const organicCount = filteredHerbs.filter(h => h.organicCertified).length;
    const nonOrganicCount = filteredHerbs.length - organicCount;

    const organicData = {
      labels: ['Organic', 'Non-Organic'],
      datasets: [
        {
          data: [organicCount, nonOrganicCount],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 99, 132, 0.5)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Registration trends chart data
    // Group by month for the last 12 months
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    const monthLabels = last12Months.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    
    const registrationCounts = monthLabels.map(monthLabel => {
      const [year, month] = monthLabel.split('-').map(Number);
      return filteredHerbs.filter(herb => {
        const herbDate = new Date(herb.createdAt);
        return herbDate.getFullYear() === year && herbDate.getMonth() + 1 === month;
      }).length;
    });

    const trendsData = {
      labels: monthLabels.map(m => {
        const [year, month] = m.split('-');
        return `${month}/${year.substring(2)}`;
      }),
      datasets: [
        {
          label: 'New Batches',
          data: registrationCounts,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };

    return { distributionData, organicData, trendsData };
  };

  const { distributionData, organicData, trendsData } = loading ? 
    { distributionData: {labels:[], datasets:[]}, organicData: {labels:[], datasets:[]}, trendsData: {labels:[], datasets:[]} } : 
    prepareChartData();

  // Calculate key metrics
  const calculateMetrics = () => {
    const filteredHerbs = getFilteredHerbs();
    
    const totalQuantity = filteredHerbs.reduce((sum, herb) => sum + (parseFloat(herb.quantity) || 0), 0);
    const uniqueFarmers = new Set(filteredHerbs.map(herb => herb.farmerName).filter(Boolean)).size;
    const uniqueLocations = new Set(filteredHerbs.map(herb => herb.farmLocation).filter(Boolean)).size;
    const organicPercentage = filteredHerbs.length > 0 ? 
      Math.round((filteredHerbs.filter(herb => herb.organicCertified).length / filteredHerbs.length) * 100) : 0;
    
    return { totalBatches: filteredHerbs.length, totalQuantity, uniqueFarmers, uniqueLocations, organicPercentage };
  };

  const metrics = loading ? { totalBatches: 0, totalQuantity: 0, uniqueFarmers: 0, uniqueLocations: 0, organicPercentage: 0 } : calculateMetrics();

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="enhanced-analytics-dashboard">
      <h2 className="dashboard-title">Enhanced Analytics Dashboard</h2>
      
      {/* Time filter controls */}
      <div className="filter-controls">
        <label>Time Period: </label>
        <select 
          value={timeframeFilter} 
          onChange={(e) => setTimeframeFilter(e.target.value)}
          className="time-filter"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last 12 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {/* Key metrics cards */}
      <div className="metrics-cards">
        <div className="metric-card">
          <h3>Total Batches</h3>
          <div className="metric-value">{metrics.totalBatches}</div>
        </div>
        <div className="metric-card">
          <h3>Total Quantity</h3>
          <div className="metric-value">{metrics.totalQuantity.toFixed(2)} kg</div>
        </div>
        <div className="metric-card">
          <h3>Unique Farmers</h3>
          <div className="metric-value">{metrics.uniqueFarmers}</div>
        </div>
        <div className="metric-card">
          <h3>Farm Locations</h3>
          <div className="metric-value">{metrics.uniqueLocations}</div>
        </div>
        <div className="metric-card">
          <h3>Organic %</h3>
          <div className="metric-value">{metrics.organicPercentage}%</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Herb Distribution</h3>
          <div className="chart-box">
            <Bar options={chartOptions} data={distributionData} />
          </div>
        </div>
        
        <div className="chart-wrapper">
          <h3>Organic Certification</h3>
          <div className="chart-box">
            <Pie options={pieOptions} data={organicData} />
          </div>
        </div>

        <div className="chart-wrapper full-width">
          <h3>Registration Trends (Last 12 Months)</h3>
          <div className="chart-box">
            <Line options={lineOptions} data={trendsData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;