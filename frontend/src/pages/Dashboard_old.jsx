import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Code, ShieldCheck, BookOpen, Rocket, ArrowTrendingUp, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const metrics = [
    {
      title: 'Ideas Validated',
      value: '24',
      change: '+3 this week',
      icon: LightBulbIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Good Evening, Innovator!</h2>
        <p className="text-gray-400">Ready to build something amazing today?</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatBox label="Ideas Validated" value="24" trend="+2 this week" />
        <StatBox label="Code Generated" value="156" trend="+12 today" />
        <StatBox label="Checks Run" value="89" trend="98% clean" />
        <StatBox label="Prototypes" value="18" trend="+2 this week" />
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="bg-[#1a1d27] p-6 rounded-xl border border-gray-800 cursor-pointer hover:border-indigo-600 transition-colors"
          onClick={() => navigate('/idea-validator')}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-xl font-semibold">Idea Validator</h4>
            <span className="text-indigo-400 text-sm">88% Accuracy</span>
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        {feature.metric}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <button
                  onClick={() => navigate(feature.path)}
                  className={`w-full py-3 px-4 bg-gradient-to-r ${feature.gradient} text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2`}
                >
                  <span>{feature.buttonText}</span>
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Need help getting started?</h3>
            <p className="text-purple-100">
              Check out our tutorials and documentation to make the most of InnoCheck.
            </p>
          </div>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors">
            View Tutorials
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
