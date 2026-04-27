import Foundation
import Supabase

enum SupabaseConfigError: Error {
    case missingURL
    case missingAnonKey
    case invalidURL
}

enum SupabaseService {
    static let client: SupabaseClient = {
        do {
            return try makeClient()
        } catch {
            fatalError("SupabaseService: \(error). Did you copy Config.example.xcconfig to Config.xcconfig?")
        }
    }()

    private static func makeClient() throws -> SupabaseClient {
        let info = Bundle.main.infoDictionary ?? [:]
        guard let urlString = info["SUPABASE_URL"] as? String, !urlString.isEmpty else {
            throw SupabaseConfigError.missingURL
        }
        guard let anonKey = info["SUPABASE_ANON_KEY"] as? String, !anonKey.isEmpty else {
            throw SupabaseConfigError.missingAnonKey
        }
        guard let url = URL(string: urlString) else {
            throw SupabaseConfigError.invalidURL
        }
        return SupabaseClient(supabaseURL: url, supabaseKey: anonKey)
    }

    static var supabaseURL: URL {
        guard
            let urlString = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String,
            let url = URL(string: urlString)
        else { fatalError("SUPABASE_URL not configured") }
        return url
    }

    static var anonKey: String {
        Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String ?? ""
    }
}
