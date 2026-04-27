import Foundation
import Supabase

struct StorageService {
    private var client: SupabaseClient { SupabaseService.client }

    /// Uploads `data` to the named bucket and returns the storage path.
    func upload(
        bucket: String,
        path: String,
        data: Data,
        contentType: String
    ) async throws -> String {
        try await client.storage
            .from(bucket)
            .upload(
                path,
                data: data,
                options: FileOptions(contentType: contentType, upsert: true)
            )
        return path
    }

    func signedURL(bucket: String, path: String, expiresIn: Int = 3600) async throws -> URL {
        try await client.storage.from(bucket).createSignedURL(path: path, expiresIn: expiresIn)
    }
}
