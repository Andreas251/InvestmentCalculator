import { useEffect, useState } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function App() {
  const [principal, setPrincipal] = useState(
    () => Number(localStorage.getItem("principal")) || 10000 // TODO: Brug defaults
  );
  const [rate, setRate] = useState(
    () => Number(localStorage.getItem("rate")) || 7
  );
  const [years, setYears] = useState(
    () => Number(localStorage.getItem("years")) || 5
  );
  const [taxRate, setTaxRate] = useState(
    () => Number(localStorage.getItem("taxRate")) || 0
  );
  const [contribution, setContribution] = useState(
    () => Number(localStorage.getItem("contribution")) || 0
  );
  const [result, setResult] = useState(null); // Før skat
  const [netResult, setNetResult] = useState(null); // Efter skat
  const [darkMode, setDarkMode] = useState(true);

  const DEFAULTS = {
    principal: 10000,
    rate: 7,
    years: 5,
    taxRate: 0,
    contribution: 0,
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("principal", principal);
    calculate();
  }, [principal]);

  useEffect(() => {
    localStorage.setItem("rate", rate);
    calculate();
  }, [rate]);

  useEffect(() => {
    localStorage.setItem("years", years);
    calculate();
  }, [years]);

  useEffect(() => {
    localStorage.setItem("taxRate", taxRate);
    calculate();
  }, [taxRate]);

  useEffect(() => {
    localStorage.setItem("contribution", contribution);
    calculate();
  }, [contribution]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.getElementById("root")?.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Chart
  const yearlyAmounts = [];
  let amount = Number(principal);
  const r = Number(rate) / 100;
  const c = Number(contribution);
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

  for (let i = 0; i < Number(years) * 12; i++) {
    amount = amount * (1 + monthlyRate) + c;
    if ((i + 1) % 12 === 0) {
      // Beregn indbetalt beløb til og med dette år
      const totalPaid = Number(principal) + Number(contribution) * (i + 1);
      const interest = amount - totalPaid;
      const tax = (interest * Number(taxRate)) / 100;
      const net = amount - tax;
      yearlyAmounts.push(Number(net.toFixed(2)));
    }
  }

  const chartData = {
    labels: Array.from(
      { length: yearlyAmounts.length },
      (_, i) => `År ${i + 1}`
    ),
    datasets: [
      {
        label: "Total beløb",
        data: yearlyAmounts,
        fill: false,
        borderColor: "#646cff",
        backgroundColor: "#646cff",
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toLocaleString("da-DK")} kr.`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => value.toLocaleString("da-DK"),
        },
      },
    },
  };

  // Functions
  function calculate() {
    let amount = Number(principal);
    const r = Number(rate) / 100;
    const c = Number(contribution);
    const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

    for (let i = 0; i < Number(years) * 12; i++) {
      amount = amount * (1 + monthlyRate) + c; // Contribution til sidst i måneden
    }

    const totalPaid =
      Number(principal) + Number(contribution) * Number(years) * 12;
    const interest = amount - totalPaid;
    const tax = (interest * Number(taxRate)) / 100;
    const net = amount - tax;

    setResult(amount.toFixed(2));
    setNetResult(net.toFixed(2));
  }

  function reset() {
    setPrincipal(DEFAULTS.principal);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
    setTaxRate(DEFAULTS.taxRate);
    setContribution(DEFAULTS.contribution);

    // Clear localStorage
    Object.keys(DEFAULTS).forEach((key) => localStorage.removeItem(key));
  }

  return (
    <div className="container">
      <button
        style={{ position: "absolute", top: 20, right: 20 }}
        onClick={() => setDarkMode((v) => !v)}
      >
        {!darkMode ? "☀️ Light mode enabled" : "🌙 Dark mode enabled"}
      </button>
      <h1 className="break-words text-4xl font-bold">
        Investerings&shy;beregner
      </h1>
      <div>
        <label>
          Startbeløb:
          <input
            type="text"
            value={Number(principal).toLocaleString("da-DK")}
            onChange={(e) => {
              // Fjern punktummer og opdater state
              const raw = e.target.value.replace(/\./g, "");
              setPrincipal(raw === "" ? "" : Number(raw));
            }}
            inputMode="numeric"
          />
        </label>
      </div>
      <div>
        <label>
          Årlig rente (%):
          <input
            type="text"
            value={rate === "" ? "" : Number(rate).toLocaleString("da-DK")}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "").replace(",", ".");
              setRate(raw === "" ? "" : Number(raw));
            }}
            inputMode="decimal"
          />
        </label>
      </div>
      <div>
        <label>
          Antal år:
          <input
            type="number"
            value={years}
            onChange={(e) => {
              let value = e.target.value.replace(/^0+/, "");

              if (value === "") {
                setYears("");
                return;
              }

              value = Math.max(1, Math.min(Number(value), 99));
              setYears(value);
            }}
            inputMode="numeric"
            min={1}
            max={99}
          />
        </label>
      </div>
      <div>
        <label>
          Skattesats (%):
          <input
            type="number"
            value={taxRate}
            onChange={(e) => {
              let value = e.target.value.replace(/^0+/, "");
              if (value === "") {
                setTaxRate("");
                return;
              }
              value = Math.max(0, Math.min(Number(value), 100));
              setTaxRate(value);
            }}
            inputMode="numeric"
            min={0}
            max={100}
          />
        </label>
      </div>
      <div>
        <label>
          Månedlig indbetaling (valgfri):
          <input
            type="text"
            value={
              contribution === ""
                ? ""
                : Number(contribution).toLocaleString("da-DK")
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "");
              setContribution(raw === "" ? "" : Number(raw));
            }}
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="button-row">
        {/* <button onClick={calculate}>Beregn</button> */}
        <button onClick={reset}>Nulstil</button>
      </div>

      <Line
        data={chartData}
        options={chartOptions}
        style={{ maxHeight: 300, maxWidth: 500, marginBottom: 32 }}
      />
      {result && (
        <div className="result-grid">
          {/* Row 1: Labels */}
          <div className="label">Indbetalt beløb:</div>
          <div className="label">Optjente renter:</div>
          <div className="label">Betalt skat:</div>
          <div className="label">Slutbeløb:</div>

          {/* Row 2: Values */}
          <div>
            {(
              Number(principal) +
              Number(contribution) * Number(years) * 12
            ).toLocaleString("da-DK")}{" "}
            kr.
          </div>
          <div>
            {(
              Number(result) -
              (Number(principal) + Number(contribution) * Number(years) * 12)
            ).toLocaleString("da-DK")}{" "}
            kr.
          </div>
          <div>
            {Number(
              (
                ((Number(result) -
                  (Number(principal) +
                    Number(contribution) * Number(years) * 12)) *
                  Number(taxRate)) /
                100
              ).toFixed(2)
            ).toLocaleString("da-DK")}{" "}
            kr.
          </div>
          <div>{Number(netResult).toLocaleString("da-DK")} kr.</div>
        </div>
      )}

      {/* {result && (
        <div>
          <h2>
            Indbetalt beløb:{" "}
            {(
              Number(principal) +
              Number(contribution) * Number(years) * 12
            ).toLocaleString("da-DK")}{" "}
            kr.
          </h2>
          <h2>
            Optjente renter:{" "}
            {(
              Number(result) -
              (Number(principal) + Number(contribution) * Number(years) * 12)
            ).toLocaleString("da-DK")}{" "}
            kr.
          </h2>
          <h2>
            Betalt skat:{" "}
            {Number(
              (
                ((Number(result) -
                  (Number(principal) +
                    Number(contribution) * Number(years) * 12)) *
                  Number(taxRate)) /
                100
              ).toFixed(2)
            ).toLocaleString("da-DK")}{" "}
            kr.
          </h2>
          <h2>Slutbeløb: {Number(netResult).toLocaleString("da-DK")} kr.</h2>
        </div>
      )} */}
    </div>
  );
}

export default App;
