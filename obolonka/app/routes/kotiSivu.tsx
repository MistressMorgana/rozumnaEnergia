import { NavLink } from "react-router";
import type { Route } from "./+types/kotiSivu";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Se on kotisivu!" },
  ];
}

export default function Home() {
  return (
    <div className="p-4">
      <nav className="bg-lime-200 p-4 flex flex-wrap gap-6 items-center rounded-md shadow-sm">
        <NavLink className="font-bold hover:text-lime-700 transition" to="sivuKaksi">
          toineen sivuun
        </NavLink>
        <NavLink 
          className="font-bold text-blue-800 bg-white px-4 py-2 rounded shadow hover:bg-blue-50 hover:text-blue-600 transition" 
          to="func_stab_Troian"
        >
          $ Smart Energy EMS (Troian)
        </NavLink>
        <NavLink className="font-bold hover:text-lime-700 transition" to="Monitoring_Monastyrnyi">
          Monitoring (Monastyrnyi)
        </NavLink>
        <NavLink 
          className="font-bold text-emerald-800 bg-white px-4 py-2 rounded shadow hover:bg-emerald-50 hover:text-emerald-600 transition" 
          to="functional-stability-shevchenko"
        >
          Functional Stability (Shevchenko)
        </NavLink>
        <NavLink className="font-bold hover:text-lime-700 transition" to="heat-flow">
          Heat Flow
        </NavLink>
      </nav>

      <h1 className="text-4xl mb-4 mt-6">
        Smart Energy Lab
      </h1>
      <h2 className="text-xl text-gray-700">
        Navigation panel above contains links to all subsystems
      </h2>
    </div>
  );
}
