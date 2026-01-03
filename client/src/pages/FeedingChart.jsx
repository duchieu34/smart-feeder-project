import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FeedingChart = ({ deviceId }) => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/devices/stats/${deviceId}`);
                const { labels, data } = res.data;

                setChartData({
                    labels: labels, // VD: ['28/12', '29/12', ...]
                    datasets: [
                        {
                            label: 'Lượng ăn (gram)',
                            data: data, // VD: [150, 120, 200...]
                            backgroundColor: 'rgba(52, 152, 219, 0.6)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                    ],
                });
            } catch (err) {
                console.error("Lỗi tải thống kê:", err);
            }
        };

        if (deviceId) {
            fetchStats();
        }
    }, [deviceId]);

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Thống kê lượng ăn 7 ngày qua',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Gram (g)' }
            }
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <Bar options={options} data={chartData} />
        </div>
    );
};

export default FeedingChart;