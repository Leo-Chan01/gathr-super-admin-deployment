import type { Metadata } from "next";
import localFont from "next/font/local";
import AppShell from "./components/layout/AppShell";
import "./globals.css";

const bricolage = localFont({
	src: "../public/fonts/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf",
	weight: "200 800",
	display: "swap",
	variable: "--font-bricolage",
	fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
	title: "Gathr Super Admin",
	description: "Gathr Super Admin Web Application",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`${bricolage.variable} ${bricolage.className} h-full antialiased`}
		>
			<body className="color-white h-full overflow-hidden flex flex-col antialiased">
				<AppShell>{children}</AppShell>
			</body>
		</html>
	);
}

