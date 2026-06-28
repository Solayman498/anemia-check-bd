import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection, getDocs, orderBy, query
} from "firebase/firestore";
import { Droplet, TrendingUp, Calendar } from "lucide-react";

function HBChart({ data }) {
  const { t, language } = useLanguage();
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  if (!data || data.length < 2) return null;
  
  const W = 800, H = 300, PAD = 50;
  const hbs = data.map(d => parseFloat(d.hb));
  const minH = Math.min(...hbs) - 0.5;
  const maxH = Math.max(...hbs) + 0.5;
  
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((parseFloat(d.hb) - minH) / (maxH - minH)) * (H - PAD * 2),
    hb: d.hb,
    date: d.date
  }));
  
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `M ${pts[0].x} ${H - PAD} ` + pts.map(p => `L ${p.x} ${p.y}`).join(" ") + ` L ${pts[pts.length-1].x} ${H - PAD} Z`;
  const trend = hbs[hbs.length-1] - hbs[0];
  const step = Math.ceil(data.length / 6);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Droplet size={20} className="text-blue-600" />
          </div>
          <p className="text-base font-semibold text-gray-800">{t.hbChart}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
          trend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)} g/dL
        </span>
      </div>
      
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]">
          <rect 
            x={PAD} y={PAD + ((maxH-18)/(maxH-minH))*(H-PAD*2)}
            width={W-PAD*2}
            height={Math.max(0, ((18-12)/(maxH-minH))*(H-PAD*2))}
            fill="#dcfce7" opacity="0.4" rx="6"
          />
          <path 
            d={areaD} 
            fill="#3b82f6" 
            opacity={animate ? "0.1" : "0"} 
            className="transition-opacity duration-1000"
          />
          <path 
            d={pathD} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            strokeDasharray={animate ? "0" : "1000"} 
            strokeDashoffset={animate ? "0" : "1000"}
            className="transition-all duration-1000 ease-out"
          />
          {pts.map((p, i) => (
            <g key={i}>
              <circle 
                cx={p.x} cy={p.y} r="5" 
                fill="white" stroke="#3b82f6" strokeWidth="3"
                opacity={animate ? "1" : "0"} 
                className="transition-all duration-300" 
                style={{ transitionDelay: `${i * 100}ms` }}
              />
              <text 
                x={p.x} y={p.y - 14} 
                textAnchor="middle" fontSize="12" 
                fill="#1f2937" fontWeight="600"
                opacity={animate ? "1" : "0"} 
                className="transition-all duration-300" 
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {p.hb}
              </text>
            </g>
          ))}
          {pts.map((p, i) => {
            if (i % step !== 0 && i !== pts.length - 1) return null;
            return (
              <g key={`label-${i}`} transform={`translate(${p.x}, ${H - 15})`}>
                <text x="0" y="0" textAnchor="middle" fontSize="11" fill="#6b7280" transform="rotate(-15)">
                  {new Date(p.date).toLocaleDateString(
                    language === "bn" ? "bn-BD" : "en-US", 
                    { day: "numeric", month: "short" }
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <div className="w-4 h-4 rounded-sm bg-green-200"></div>
        <span className="text-sm text-gray-500">{t.normalRange}</span>
      </div>
    </div>
  );
}

export default function HBTracker() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hbHistory, setHbHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const resSnap = await getDocs(query(collection(db, "users", uid, "results"), orderBy("date", "asc")));
        const hbs = resSnap.docs
          .filter(d => d.data().labData?.hb)
          .map(d => ({ 
            date: d.data().date.split("T")[0], 
            hb: d.data().labData.hb 
          }));
        setHbHistory(hbs);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hbHistory.length >= 2 ? (
        <>
          <HBChart data={hbHistory} />
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                {t.allHBRecords}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {[...hbHistory].reverse().map((h, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? (parseFloat(h.hb) - parseFloat(prev.hb)).toFixed(1) : null;
                return (
                  <div key={i} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition">
                    <p className="text-sm text-gray-700">
                      {new Date(h.date).toLocaleDateString(
                        language === "bn" ? "bn-BD" : "en-US",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{h.hb} <span className="text-xs text-gray-400">g/dL</span></p>
                      {diff !== null && (
                        <p className={`text-xs font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {diff >= 0 ? "↑" : "↓"} {Math.abs(diff)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-600 font-medium">{t.needScreenings}</p>
          <p className="text-gray-400 text-sm mt-1">{t.needMoreData}</p>
          <button 
            onClick={() => navigate("/lab")} 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            {t.newScreening}
          </button>
        </div>
      )}
    </div>
  );
}