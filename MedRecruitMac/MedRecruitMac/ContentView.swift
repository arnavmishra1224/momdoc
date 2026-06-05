//
//  ContentView.swift
//  MedRecruitMac
//
//  Created by Gina Escalante
//

import SwiftUI
import AppKit
import PDFKit
import UniformTypeIdentifiers


enum AppSection: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case candidates = "Candidates"
    case outreach = "Outreach"
    case followUps = "Follow-Ups"

    var id: String { rawValue }
}

struct ContentView: View {
    
    @State private var selectedSection: AppSection = .candidates
    @State private var selectedCandidate: Candidate?
    @State private var candidates: [Candidate] = loadCandidates()
    var body: some View {
        NavigationSplitView {
            List(selection: $selectedSection) {
                ForEach(AppSection.allCases) { section in
                    Text(section.rawValue)
                        .tag(section)
                }
            }
            .navigationTitle("MedRecruit Admin")
        } detail: {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 15/255, green: 23/255, blue: 42/255),
                        Color.blue.opacity(0.5),
                        Color.purple.opacity(0.5)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                switch selectedSection {
                case .dashboard:
                    DashboardView(candidates: candidates)
                    
                case .candidates:
                    CandidatesView(
                        candidates: $candidates,
                        selectedCandidate: $selectedCandidate
                    )
                    
                case .outreach:
                    OutreachView()
                    
                case .followUps:
                    FollowUpsView(
                        candidates: $candidates,
                        selectedCandidate: $selectedCandidate,
                        selectedSection: $selectedSection
                    )
                }
            }
            .onChange(of: candidates) {
                saveCandidates(candidates)
            }
        }
    }
    
    struct CandidatesView: View {
        
        @Binding var candidates: [Candidate]
        @Binding var selectedCandidate: Candidate?
        
        @State private var showingAddCandidate = false
        @State private var searchText = ""
        
        var filteredCandidates: [Candidate] {
            if searchText.isEmpty {
                return candidates
            } else {
                return candidates.filter {
                    $0.name.localizedCaseInsensitiveContains(searchText) ||
                    $0.email.localizedCaseInsensitiveContains(searchText) ||
                    $0.program.localizedCaseInsensitiveContains(searchText) ||
                    $0.state.localizedCaseInsensitiveContains(searchText) ||
                    $0.status.localizedCaseInsensitiveContains(searchText)
                }
            }
        }
        var body: some View {
            HStack(spacing: 20) {
                
                VStack(alignment: .leading, spacing: 16) {
                    MomDocHeader()

                    HStack {
                        Text("Candidates")
                            .font(.largeTitle)
                            .bold()
                            .foregroundColor(.white)

                        Spacer()

                        Button("Upload PDF CV") {
                            uploadPDF()
                        }

                        Button("Add Candidate") {
                            showingAddCandidate = true
                        }
                    }
                    TextField("Search candidates...", text: $searchText)
                        .textFieldStyle(.roundedBorder)
                        
                        List(filteredCandidates, selection: $selectedCandidate) { candidate in
                        
                        VStack(alignment: .leading, spacing: 5) {
                            Text(candidate.name)
                                .font(.headline)
                            
                            Text(candidate.program)
                                .font(.subheadline)
                            
                            Text(candidate.status)
                                .font(.caption)
                                .foregroundColor(.purple)
                        }
                        .padding(6)
                        .tag(candidate)
                    }
                    .scrollContentBackground(.hidden)
                }
                .frame(width: 430)
                .padding()
                
                if let candidate = selectedCandidate {
                    CandidateDetailView(
                        candidate: candidate,
                        candidates: $candidates,
                        selectedCandidate: $selectedCandidate
                    )
                    
                    
                } else {
                    Text("Upload a CV, add a candidate, or select a candidate")
                        .foregroundColor(.white)
                        .font(.title)
                }
                
                Spacer()
            }
            .padding()
            .sheet(isPresented: $showingAddCandidate) {
                AddCandidateView(candidates: $candidates, selectedCandidate: $selectedCandidate)
            }
        }
        
        func uploadCSV() {
            
            let panel = NSOpenPanel()
            
            panel.allowedContentTypes = [
                .commaSeparatedText,
                .plainText
            ]
            
            panel.allowsMultipleSelection = false
            panel.canChooseDirectories = false
            
            if panel.runModal() == .OK {
                
                guard let url = panel.url else { return }
                
                do {
                    
                    let csvText = try String(
                        contentsOf: url,
                        encoding: .utf8
                    )
                    
                    let importedCandidates =
                    parseCSV(csvText)
                    
                    candidates = importedCandidates
                    
                    selectedCandidate =
                    importedCandidates.first
                    
                } catch {
                    
                    print("Error reading CSV: \(error)")
                }
            }
        }
        
        func uploadPDF() {
            
            let panel = NSOpenPanel()
            panel.allowedContentTypes = [.pdf]
            panel.allowsMultipleSelection = false
            panel.canChooseDirectories = false
            
            if panel.runModal() == .OK {
                
                guard let url = panel.url else { return }
                
                if let pdf = PDFDocument(url: url) {
                    
                    var fullText = ""
                    
                    for i in 0..<pdf.pageCount {
                        
                        if let page = pdf.page(at: i),
                           let text = page.string {
                            
                            fullText += text + "\n"
                        }
                    }
                    
                    let candidate = extractCandidateFromPDF(fullText)
                    
                    candidates.append(candidate)
                    selectedCandidate = candidate
                }
            }
        }
        
        func extractCandidateFromPDF(_ text: String) -> Candidate {
            
            let lines = text.components(separatedBy: .newlines)
            
            let name =
            lines.first?
                .trimmingCharacters(in: .whitespacesAndNewlines)
            ?? "Unknown Candidate"
            
            let email = findMatch(
                in: text,
                pattern: "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
            )
            
            let phone = findMatch(
                in: text,
                pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}"
            )
            
            let specialty =
            text.localizedCaseInsensitiveContains("Dermatopathology")
            ? "Dermatopathology"
            : "Physician"
            
            let state =
            text.localizedCaseInsensitiveContains("California")
            || text.contains("CA")
            ? "CA"
            : ""
            
            let bioNotes = String(text.prefix(900))
            
            return Candidate(
                name: name,
                email: email,
                phone: phone,
                program: specialty,
                state: state,
                bioNotes: bioNotes,
                status: "New Lead",
                followUpDate: twoWeeksFromToday(),
                notes: "Imported from uploaded PDF CV.",
                dateAdded: Date.now.formatted(date: .abbreviated, time: .omitted),
                lastContactDate: "",
                outreachCount: 0,
                hasResponded: false
            )
        }
        
        func findMatch(
            in text: String,
            pattern: String
        ) -> String {
            
            do {
                
                let regex = try NSRegularExpression(
                    pattern: pattern
                )
                
                let range = NSRange(
                    text.startIndex..<text.endIndex,
                    in: text
                )
                
                if let match =
                    regex.firstMatch(
                        in: text,
                        range: range
                    ),
                   let swiftRange =
                    Range(match.range, in: text) {
                    
                    return String(text[swiftRange])
                }
                
            } catch {
                
                print("Regex error: \(error)")
            }
            
            return ""
        }
        
        func parseCSV(_ text: String) -> [Candidate] {
            var results: [Candidate] = []
            
            let rows = text.components(separatedBy: .newlines).filter {
                !$0.trimmingCharacters(in: .whitespaces).isEmpty
            }
            
            guard rows.count > 1 else {
                return []
            }
            
            for row in rows.dropFirst() {
                let columns = row.components(separatedBy: ",")
                
                let candidate = Candidate(
                    name: columns.count > 0 ? columns[0] : "",
                    email: columns.count > 1 ? columns[1] : "",
                    phone: columns.count > 2 ? columns[2] : "",
                    program: columns.count > 3 ? columns[3] : "",
                    state: columns.count > 4 ? columns[4] : "",
                    bioNotes: columns.count > 5 ? columns[5] : "",
                    status: columns.count > 6 && !columns[6].isEmpty ? columns[6] : "New Lead",
                    followUpDate: columns.count > 7 ? columns[7] : "",
                    notes: columns.count > 8 ? columns[8] : "",
                    dateAdded: Date.now.formatted(date: .abbreviated, time: .omitted),
                    lastContactDate: "",
                    outreachCount: 0,
                    hasResponded: false
                )
                results.append(candidate)
            }
            
            return results
        }
    }
    
    struct AddCandidateView: View {
        
        @Environment(\.dismiss) var dismiss
        
        @Binding var candidates: [Candidate]
        @Binding var selectedCandidate: Candidate?
        
        @State private var name = ""
        @State private var email = ""
        @State private var phone = ""
        @State private var program = ""
        @State private var state = ""
        @State private var bioNotes = ""
        @State private var status = "New Lead"
        @State private var followUpDate = ""
        @State private var notes = ""
        
        let statuses = [
            "New Lead",
            "Outreach Sent",
            "Responded",
            "Interested",
            "Follow Up",
            "Not Interested",
            "Closed"
        ]
        
        var body: some View {
            VStack(alignment: .leading, spacing: 16) {
                
                Text("Add Candidate")
                    .font(.largeTitle)
                    .bold()
                
                Form {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                    TextField("Phone", text: $phone)
                    TextField("Program", text: $program)
                    TextField("State", text: $state)
                    
                    Picker("Status", selection: $status) {
                        ForEach(statuses, id: \.self) { status in
                            Text(status)
                        }
                    }
                    
                    TextField("Follow-Up Date", text: $followUpDate)
                    
                    TextField("Bio Notes", text: $bioNotes, axis: .vertical)
                        .lineLimit(3...6)
                    
                    TextField("Recruiter Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                HStack {
                    Spacer()
                    
                    Button("Cancel") {
                        dismiss()
                    }
                    
                    Button("Save Candidate") {
                        saveCandidate()
                    }
                    .keyboardShortcut(.defaultAction)
                }
            }
            .padding(30)
            .frame(width: 600, height: 650)
        }
        
        func saveCandidate() {
             let newCandidate = Candidate(
                name: name,
                email: email,
                phone: phone,
                program: program,
                state: state,
                bioNotes: bioNotes,
                status: status,
                followUpDate: twoWeeksFromToday(),
                notes: notes,
                dateAdded: Date.now.formatted(date: .abbreviated, time: .omitted),
                lastContactDate: "",
                outreachCount: 0,
                hasResponded: false
            )
            
            candidates.append(newCandidate)
            selectedCandidate = newCandidate
            dismiss()
        }
    }
    
    struct CandidateDetailView: View {
        
        let candidate: Candidate
        @Binding var candidates: [Candidate]
        @Binding var selectedCandidate: Candidate?
        
        var emailBody: String {
        """
        Hi \(candidate.name),
        
        I came across your profile and noticed your experience with \(candidate.program) in \(candidate.state).
        
        I also saw your interest in:
        \(candidate.bioNotes)
        
        We are currently recruiting OBGYN physicians and I thought there may be opportunities that align well with your background and interests.
        
        Would you be open to learning more?
        
        Best,
        Gina
        Recruitment Team
        """
        }
        
        var textMessageBody: String {
            """
            Hi \(candidate.name), this is Gina with MomDoc. I came across your background in \(candidate.program) and wanted to reach out regarding physician opportunities that may align with your experience. Would you be open to learning more?
            """
        }
        var body: some View {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    
                    Text(candidate.name)
                        .font(.largeTitle)
                        .bold()
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        
                        Text("Date Added")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Text(candidate.dateAdded)
                            .foregroundColor(.white)
                            .bold()
                    }
                }
                Group {
                    Text("Program: \(candidate.program)")
                    Text("State: \(candidate.state)")
                    Text("Email: \(candidate.email)")
                    Text("Phone: \(candidate.phone)")
                    Text("Status: \(candidate.status)")
                    Text("Follow-Up Date: \(candidate.followUpDate)")
                }
                .foregroundColor(.white)
                
                Divider()
                
                Text("Bio Notes")
                    .font(.headline)
                    .foregroundColor(.purple)
                
                Text(candidate.bioNotes)
                    .foregroundColor(.white)
                
                Text("Recruiter Notes")
                    .font(.headline)
                    .foregroundColor(.purple)
                
                Text(candidate.notes)
                    .foregroundColor(.white)
                
                HStack(spacing: 16) {
                    
                    Button("Email Candidate") {
                        openEmail(candidate: candidate)
                    }
                    
                    Button("Send Text") {
                        sendText(candidate)
                    }
                    
                    Button("Copy Email Draft") {
                        
                        NSPasteboard.general.clearContents()
                        
                        NSPasteboard.general.setString(
                            emailBody,
                            forType: .string
                        )
                }
                    
                    Button("Delete Candidate") {
                        deleteCandidate(candidate)
                    }
                    .foregroundColor(.red)
                }
                
                Spacer()
            }
            .padding(30)
        }
        
        func openEmail(candidate: Candidate) {
            
            let subject = "OBGYN Opportunity"
            
            let encodedSubject =
            subject.addingPercentEncoding(
                withAllowedCharacters: .urlQueryAllowed
            ) ?? ""
            
            let encodedBody =
            emailBody.addingPercentEncoding(
                withAllowedCharacters: .urlQueryAllowed
            ) ?? ""
            
            if let url = URL(
                string:
                    "mailto:\(candidate.email)?subject=\(encodedSubject)&body=\(encodedBody)"
            ) {
                
                NSWorkspace.shared.open(url)
            }
        }
        
        func sendText(_ candidate: Candidate) {

            let cleanPhone = candidate.phone
                .replacingOccurrences(of: " ", with: "")
                .replacingOccurrences(of: "-", with: "")
                .replacingOccurrences(of: "(", with: "")
                .replacingOccurrences(of: ")", with: "")

            let encodedMessage =
            textMessageBody.addingPercentEncoding(
                withAllowedCharacters: .urlQueryAllowed
            ) ?? ""

            if let url = URL(
                string: "sms:\(cleanPhone)?body=\(encodedMessage)"
            ) {
                NSWorkspace.shared.open(url)
            }
        }
        
        func deleteCandidate(_ candidate: Candidate) {
            
            candidates.removeAll {
                $0.id == candidate.id
            }
            
            selectedCandidate = nil
        }
    }
    struct DashboardView: View {
        
        let candidates: [Candidate]
        
        var body: some View {
            VStack(alignment: .leading, spacing: 20) {

                Image("momdoc_logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 300)

                Text("MedRecruit Dashboard")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.white)

                Text("Total Candidates: \(candidates.count)")
                    .foregroundColor(.white)

                Spacer()
            }
            .padding(30)
        }
    }
    
    struct OutreachView: View {
        var body: some View {
            VStack(alignment: .leading,spacing:20){
                
                MomDocHeader()
                
                Text("Outreach")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.white)
                
                Text("Generate personalized emails from the Candidates section.")
                    .foregroundColor(.white)
                
                Spacer()
            }
            .padding(30)
        }
    }
    struct FollowUpsView: View {

        @Binding var candidates: [Candidate]
        @Binding var selectedCandidate: Candidate?
        @Binding var selectedSection: AppSection

        var dueCandidates: [Candidate] {
            candidates.filter {
                isFollowUpDue($0.followUpDate)
            }
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 20) {

                MomDocHeader()
                
                Text("Follow-Ups Due")
                    .font(.largeTitle)
                    .bold()
                    .foregroundColor(.white)

                if dueCandidates.isEmpty {
                    Text("No follow-ups due right now.")
                        .foregroundColor(.white)
                } else {
                    List(dueCandidates) { candidate in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(candidate.name)
                                    .font(.headline)

                                Text("Due: \(candidate.followUpDate)")
                                    .foregroundColor(.gray)
                            }

                            Spacer()

                            Button("View Candidate") {
                                selectedCandidate = candidate
                                selectedSection = .candidates
                            }
                        }
                        .padding(4)
                    }
                }

                Spacer()
            }
            .padding(30)
        }
    }
}
#Preview {
    ContentView()
}

func twoWeeksFromToday() -> String {
    let futureDate = Calendar.current.date(
        byAdding: .day,
        value: 14,
        to: Date()
    ) ?? Date()

    return futureDate.formatted(
        date: .abbreviated,
        time: .omitted
    )
}

func isFollowUpDue(_ dateString: String) -> Bool {

    guard let date =
        DateFormatter.shortDateFormatter.date(
            from: dateString
        ) else {

        return false
    }

    return date <= Date()
}

extension DateFormatter {

    static let shortDateFormatter: DateFormatter = {

        let formatter = DateFormatter()

        formatter.dateStyle = .medium
        formatter.timeStyle = .none

        return formatter

    }()
}
func saveCandidates(_ candidates: [Candidate]) {
    do {
        let data = try JSONEncoder().encode(candidates)
        let url = getCandidatesFileURL()
        try data.write(to: url)
        print("Candidates saved.")
    } catch {
        print("Error saving candidates: \(error)")
    }
}

func loadCandidates() -> [Candidate] {
    do {
        let url = getCandidatesFileURL()
        let data = try Data(contentsOf: url)
        let candidates = try JSONDecoder().decode([Candidate].self, from: data)
        return candidates
    } catch {
        print("No saved candidates found yet.")
        return []
    }
}

func getCandidatesFileURL() -> URL {
    let folder = FileManager.default.urls(
        for: .documentDirectory,
        in: .userDomainMask
    )[0]

    return folder.appendingPathComponent("candidates.json")
}
struct MomDocHeader: View {

    var body: some View {

        HStack {

            Spacer()

            Image("momdoc_logo")
                .resizable()
                .scaledToFit()
                .frame(width: 120)
        }
        .padding(.horizontal)
        .padding(.top, 10)
    }
}
