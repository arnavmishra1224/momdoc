//
//  Canidate.swift
//  MedRecruitMac
//
//  Created by Gina escalante  on 5/20/26.
//

import Foundation

struct Candidate: Identifiable, Hashable, Codable {

    var id = UUID()

    var name: String
    var email: String
    var phone: String
    var program: String
    var state: String
    var bioNotes: String
    var status: String
    var followUpDate: String
    var notes: String
    var dateAdded: String
    var lastContactDate: String
    var outreachCount: Int
    var hasResponded: Bool
}
