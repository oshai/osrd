use axum::extract::Request;
use axum::extract::State;
use axum::http::Uri;
use axum::response::IntoResponse;
use percent_encoding::percent_decode_str;
use tower::ServiceExt as _;
use tower_http::services::ServeFile;

use crate::AppState;
use crate::views::files::FileNotFoundError;

#[editoast_derive::route]
#[utoipa::path(
    get, path = "",
    tag = "assets",
    params(
        ("*file_path" = String, Path, description = "File path"),
    ),
    responses(
        (status = 200, description = "The requested asset"),
        FileNotFoundError,
    ),
)]
pub(in crate::views) async fn get(
    uri: Uri,
    State(AppState { config, .. }): State<AppState>,
    request: Request,
) -> Result<impl IntoResponse, FileNotFoundError> {
    let file_path = percent_decode_str(uri.path().strip_prefix("/assets/").unwrap())
        .decode_utf8_lossy()
        .into_owned();
    let path = config.dynamic_assets_path.join(&file_path);
    println!("path printed {}", path.display());
    if !path.is_file() {
        return Err(FileNotFoundError { file: file_path });
    }

    // Avoid path traversal attack by ensuring the path is within the dynamic assets directory
    let canonical_path = path.canonicalize().unwrap();
    let canonical_assets_path = config.dynamic_assets_path.canonicalize().unwrap();
    if !canonical_path.starts_with(&canonical_assets_path) {
        return Err(FileNotFoundError { file: file_path });
    }

    Ok(ServeFile::new(&path).oneshot(request).await)
}

#[cfg(test)]
mod tests {
    use crate::views::test_app;

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn icons_works() {
        let app = test_app!().skip_authz().build();
        let response = app.get("/assets/icons/TVM300/REP%20TGV.svg").await;
        response.assert_status_ok();
        assert_eq!("image/svg+xml", response.content_type());
        let response = response.into_bytes();
        let expected = std::fs::read(
            app.config()
                .dynamic_assets_path
                .join("icons/TVM300/REP TGV.svg"),
        )
        .unwrap();
        assert_eq!(response, expected);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn icons_not_found() {
        let app = test_app!().skip_authz().build();
        app.get("/assets/icons/TVM300/NOT_A_THING.svg")
            .await
            .assert_status_not_found();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn sprites() {
        let app = test_app!().skip_authz().build();
        let response = app.get("/assets/sprites/TVM300/REP%20TGV.svg").await;
        response.assert_status_ok();
        assert_eq!("image/svg+xml", response.content_type());
        let response = response.into_bytes();
        let expected = std::fs::read(
            app.config()
                .dynamic_assets_path
                .join("sprites/TVM300/REP TGV.svg"),
        )
        .unwrap();
        assert_eq!(response, expected);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn sprites_not_found() {
        let app = test_app!().skip_authz().build();
        app.get("/assets/sprites/TVM300/NOT_A_THING.svg")
            .await
            .assert_status_not_found();
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn font_works() {
        let app = test_app!().skip_authz().build();
        let response = app.get("/assets/fonts/glyphs/IBMPlexSans/0-255.pbf").await;
        response.assert_status_ok();
        assert_eq!("application/octet-stream", response.content_type());
        let response = response.into_bytes();
        let expected = std::fs::read(
            app.config()
                .dynamic_assets_path
                .join("fonts/glyphs/IBMPlexSans/0-255.pbf"),
        )
        .unwrap();
        assert_eq!(response, expected);
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 1)]
    async fn font_not_found() {
        let app = test_app!().skip_authz().build();
        app.get("/assets/fonts/glyphs/Comic%20Sans/0-255.pbf")
            .await
            .assert_status_not_found();
    }
}
